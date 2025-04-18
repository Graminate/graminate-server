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
        `SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC`,
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
      amount_paid,
      amount_due,
      due_date,
      status,
    } = body;

    if (!user_id || !title || !bill_to || !amount_due || !due_date || !status) {
      return { status: 400, data: { error: 'Missing required fields.' } };
    }

    const amountPaid = amount_paid ? parseFloat(amount_paid) : 0;
    const amountDue = parseFloat(amount_due);
    if (isNaN(amountPaid) || isNaN(amountDue)) {
      return { status: 400, data: { error: 'Invalid amount values.' } };
    }

    try {
      const result = await pool.query(
        `INSERT INTO invoices (user_id, title, bill_to, amount_paid, amount_due, due_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *;`,
        [user_id, title, bill_to, amountPaid, amountDue, due_date, status],
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
      bill_to,
      ship_to,
      payment_terms,
      due_date,
      po_number,
      notes,
      terms,
      amount_paid,
      amount_due,
      status,
      tax,
      discount,
      shipping,
      items,
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
            ship_to = $4,
            payment_terms = $5,
            due_date = $6,
            po_number = $7,
            notes = $8,
            terms = $9,
            amount_paid = $10,
            amount_due = $11,
            status = $12,
            tax = $13,
            discount = $14,
            shipping = $15
        WHERE invoice_id = $16
        RETURNING *;
      `;

      const invoiceUpdateValues = [
        user_id,
        title,
        bill_to,
        ship_to,
        payment_terms,
        due_date,
        po_number,
        notes,
        terms,
        amount_paid,
        amount_due,
        status,
        tax,
        discount,
        shipping,
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
