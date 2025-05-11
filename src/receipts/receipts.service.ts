import { Injectable, InternalServerErrorException } from '@nestjs/common';
import pool from '@/config/database';

@Injectable()
export class ReceiptsService {
  async getReceipts(id: string) {
    try {
      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId)) {
        return { status: 400, data: { error: 'Invalid userId parameter' } };
      }

      const result = await pool.query(
        `SELECT * FROM invoices WHERE user_id = $1 ORDER BY receipt_date DESC`,
        [parsedId],
      );

      return { status: 200, data: { receipts: result.rows } };
    } catch (err) {
      console.error('Error fetching receipts:', err);
      return { status: 500, data: { error: 'Failed to fetch receipts' } };
    }
  }

  async addReceipt(body: any) {
    const {
      user_id,
      title,
      bill_to,
      due_date,
      receipt_number,
      bill_to_address_line1,
      bill_to_address_line2,
      bill_to_city,
      bill_to_state,
      bill_to_postal_code,
      bill_to_country,
      tax,
      discount,
      shipping,
      notes,
      payment_terms,
    } = body;

    if (!user_id || !title || !bill_to || !due_date || !receipt_number) {
      return {
        status: 400,
        data: {
          error:
            'Missing required fields (user_id, title, bill_to, due_date, receipt_number).',
        },
      };
    }

    try {
      const result = await pool.query(
        `INSERT INTO invoices (
           user_id, title, bill_to, due_date, receipt_number,
           bill_to_address_line1, bill_to_address_line2, bill_to_city, bill_to_state, bill_to_postal_code, bill_to_country,
           tax, discount, shipping, notes, payment_terms
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         RETURNING *;`,
        [
          user_id,
          title,
          bill_to,
          due_date,
          receipt_number,
          bill_to_address_line1,
          bill_to_address_line2,
          bill_to_city,
          bill_to_state,
          bill_to_postal_code,
          bill_to_country,
          tax || 0,
          discount || 0,
          shipping || 0,
          notes,
          payment_terms,
        ],
      );

      return {
        status: 201,
        data: {
          message: 'Invoice added successfully',
          invoice: result.rows[0],
        },
      };
    } catch (err) {
      console.error('Error adding invoice:', err);
      if (err.constraint === 'invoices_receipt_number_key') {
        return {
          status: 409,
          data: { error: 'Receipt number already exists.' },
        };
      }
      return { status: 500, data: { error: 'Internal Server Error' } };
    }
  }

  async deleteReceipt(id: string) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return { status: 400, data: { error: 'Invalid receipt ID' } };
    }

    try {
      const result = await pool.query(
        'DELETE FROM invoices WHERE invoice_id = $1 RETURNING *',
        [parsedId],
      );

      if (result.rowCount === 0) {
        return { status: 404, data: { error: 'Receipt not found' } };
      }

      return {
        status: 200,
        data: {
          message: 'Receipt deleted successfully',
          receipt: result.rows[0],
        },
      };
    } catch (err) {
      console.error('Error deleting receipt:', err);
      return { status: 500, data: { error: 'Failed to delete receipt' } };
    }
  }

  async updateReceipt(body: any) {
    const {
      invoice_id,
      user_id,
      title,
      receipt_number, // Added
      bill_to,
      payment_terms,
      due_date,
      notes,
      tax,
      discount,
      shipping,
      items,
      bill_to_address_line1, // Added
      bill_to_address_line2, // Added
      bill_to_city, // Added
      bill_to_state, // Added
      bill_to_postal_code, // Added
      bill_to_country, // Added
    } = body;

    if (!invoice_id) {
      return { status: 400, data: { error: 'Receipt ID is required' } };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const invoiceUpdateQuery = `
        UPDATE invoices 
        SET user_id = $1,
            title = $2,
            bill_to = $3,
            payment_terms = $4,
            due_date = $5,
            notes = $6,
            tax = $7,
            discount = $8,
            shipping = $9,
            receipt_number = $10,
            bill_to_address_line1 = $11,
            bill_to_address_line2 = $12,
            bill_to_city = $13,
            bill_to_state = $14,
            bill_to_postal_code = $15,
            bill_to_country = $16
        WHERE invoice_id = $17
        RETURNING *;
      `;

      const invoiceUpdateValues = [
        user_id,
        title,
        bill_to,
        payment_terms,
        due_date,
        notes,
        tax,
        discount,
        shipping,
        receipt_number,
        bill_to_address_line1,
        bill_to_address_line2,
        bill_to_city,
        bill_to_state,
        bill_to_postal_code,
        bill_to_country,
        invoice_id,
      ];

      const invoiceResult = await client.query(
        invoiceUpdateQuery,
        invoiceUpdateValues,
      );
      if (invoiceResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return { status: 404, data: { error: 'Receipt not found' } };
      }

      if (Array.isArray(items) && items.length > 0) {
        await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [
          invoice_id,
        ]);

        const itemInsertQuery = `
          INSERT INTO invoice_items (invoice_id, description, quantity, rate)
          VALUES ($1, $2, $3, $4);
        `;

        for (const item of items) {
          await client.query(itemInsertQuery, [
            invoice_id,
            item.description,
            item.quantity,
            item.rate,
          ]);
        }
      }

      await client.query('COMMIT');
      return {
        status: 200,
        data: { success: true, invoice: invoiceResult.rows[0] },
      };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error updating receipt:', err);
      if (err.constraint === 'invoices_receipt_number_key') {
        return {
          status: 409,
          data: { error: 'Receipt number already exists.' },
        };
      }
      return { status: 500, data: { error: 'Internal server error' } };
    } finally {
      client.release();
    }
  }

  async resetTable(userId: number): Promise<{ message: string }> {
    try {
      await pool.query('TRUNCATE invoices RESTART IDENTITY CASCADE');
      return { message: `Receipts (invoices) table reset for user ${userId}` };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
