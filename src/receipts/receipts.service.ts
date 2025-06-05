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
        `SELECT
            i.*,
            i.sales_id,
            COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            'item_id', ii.item_id,
                            'description', ii.description,
                            'quantity', ii.quantity,
                            'rate', ii.rate
                        )
                    )
                    FROM invoice_items ii
                    WHERE ii.invoice_id = i.invoice_id
                ),
                '[]'::json
            ) AS items
         FROM invoices i
         WHERE i.user_id = $1
         ORDER BY i.receipt_date DESC`,
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
      receipt_number, // Now optional
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
      items,
      linked_sale_id,
    } = body;

    if (!user_id || !title || !bill_to || !due_date) {
      // receipt_number removed from here
      return {
        status: 400,
        data: {
          error: 'Missing required fields (user_id, title, bill_to, due_date).',
        },
      };
    }

    const invoiceOwnerUserId = parseInt(user_id, 10);
    if (isNaN(invoiceOwnerUserId)) {
      return {
        status: 400,
        data: { error: 'Invalid user_id format for invoice owner.' },
      };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (linked_sale_id) {
        const saleCheckResult = await client.query(
          'SELECT user_id, invoice_created FROM sales WHERE sales_id = $1 FOR UPDATE',
          [linked_sale_id],
        );
        if (saleCheckResult.rowCount === 0) {
          await client.query('ROLLBACK');
          return { status: 404, data: { error: 'Linked sale not found.' } };
        }
        const saleData = saleCheckResult.rows[0];
        if (saleData.user_id !== invoiceOwnerUserId) {
          await client.query('ROLLBACK');
          return {
            status: 403,
            data: { error: 'Linked sale belongs to a different user.' },
          };
        }
        if (saleData.invoice_created) {
          await client.query('ROLLBACK');
          return {
            status: 409,
            data: { error: 'Selected sale already has an invoice linked.' },
          };
        }
      }

      const invoiceResult = await client.query(
        `INSERT INTO invoices (
           user_id, title, bill_to, due_date, receipt_number,
           bill_to_address_line1, bill_to_address_line2, bill_to_city, bill_to_state, bill_to_postal_code, bill_to_country,
           tax, discount, shipping, notes, payment_terms, sales_id
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         RETURNING *;`,
        [
          invoiceOwnerUserId,
          title,
          bill_to,
          due_date,
          receipt_number || null, // Ensure null if empty
          bill_to_address_line1 || null,
          bill_to_address_line2 || null,
          bill_to_city || null,
          bill_to_state || null,
          bill_to_postal_code || null,
          bill_to_country || null,
          tax || 0,
          discount || 0,
          shipping || 0,
          notes,
          payment_terms,
          linked_sale_id || null,
        ],
      );

      const newInvoice = invoiceResult.rows[0];
      const newInvoiceId = newInvoice.invoice_id;

      if (Array.isArray(items) && items.length > 0) {
        const itemInsertQuery = `
          INSERT INTO invoice_items (invoice_id, description, quantity, rate)
          VALUES ($1, $2, $3, $4);
        `;
        for (const item of items) {
          await client.query(itemInsertQuery, [
            newInvoiceId,
            item.description,
            item.quantity,
            item.rate,
          ]);
        }
      }

      if (linked_sale_id) {
        await client.query(
          'UPDATE sales SET invoice_created = true WHERE sales_id = $1',
          [linked_sale_id],
        );
      }

      await client.query('COMMIT');
      return {
        status: 201,
        data: {
          message: 'Invoice added successfully',
          invoice: newInvoice,
        },
      };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error adding invoice:', err);
      if (err.constraint === 'invoices_receipt_number_key' && receipt_number) {
        // Only if receipt_number was provided
        return {
          status: 409,
          data: { error: 'Receipt number already exists.' },
        };
      }
      if (err.constraint === 'invoices_sales_id_unique') {
        return {
          status: 409,
          data: { error: 'This sale is already linked to another invoice.' },
        };
      }
      return { status: 500, data: { error: 'Internal Server Error' } };
    } finally {
      client.release();
    }
  }

  async deleteReceipt(id: string) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return { status: 400, data: { error: 'Invalid receipt ID' } };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        'DELETE FROM invoices WHERE invoice_id = $1 RETURNING *',
        [parsedId],
      );

      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return { status: 404, data: { error: 'Receipt not found' } };
      }

      const deletedInvoice = result.rows[0];
      if (deletedInvoice.sales_id) {
        await client.query(
          'UPDATE sales SET invoice_created = false WHERE sales_id = $1',
          [deletedInvoice.sales_id],
        );
      }

      await client.query('COMMIT');
      return {
        status: 200,
        data: {
          message: 'Receipt deleted successfully',
          receipt: deletedInvoice,
        },
      };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error deleting receipt:', err);
      return { status: 500, data: { error: 'Failed to delete receipt' } };
    } finally {
      client.release();
    }
  }

  async updateReceipt(body: any) {
    const {
      invoice_id,
      user_id,
      title,
      receipt_number, // Optional
      bill_to,
      payment_terms,
      due_date,
      notes,
      tax,
      discount,
      shipping,
      items,
      bill_to_address_line1,
      bill_to_address_line2,
      bill_to_city,
      bill_to_state,
      bill_to_postal_code,
      bill_to_country,
      linked_sale_id,
    } = body;

    if (!invoice_id) {
      return { status: 400, data: { error: 'Receipt ID is required' } };
    }
    if (!title || !bill_to || !due_date) {
      // receipt_number removed
      return {
        status: 400,
        data: { error: 'Missing required fields (title, bill_to, due_date).' },
      };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const currentInvoiceRes = await client.query(
        'SELECT sales_id as old_linked_sale_id, user_id as original_invoice_owner_id FROM invoices WHERE invoice_id = $1 FOR UPDATE',
        [invoice_id],
      );

      if (currentInvoiceRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return {
          status: 404,
          data: { error: 'Receipt not found for update.' },
        };
      }
      const { old_linked_sale_id, original_invoice_owner_id } =
        currentInvoiceRes.rows[0];

      let targetInvoiceOwnerId: number;
      if (user_id !== undefined && user_id !== null) {
        targetInvoiceOwnerId = parseInt(user_id, 10);
        if (isNaN(targetInvoiceOwnerId)) {
          await client.query('ROLLBACK');
          return {
            status: 400,
            data: {
              error:
                'Invalid user_id format in request body for invoice owner.',
            },
          };
        }
      } else {
        targetInvoiceOwnerId = original_invoice_owner_id;
      }

      if (linked_sale_id !== old_linked_sale_id) {
        if (old_linked_sale_id) {
          await client.query(
            'UPDATE sales SET invoice_created = false WHERE sales_id = $1',
            [old_linked_sale_id],
          );
        }
        if (linked_sale_id) {
          const newSaleRes = await client.query(
            'SELECT user_id, invoice_created FROM sales WHERE sales_id = $1 FOR UPDATE',
            [linked_sale_id],
          );
          if (newSaleRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return {
              status: 404,
              data: { error: 'New linked sale not found.' },
            };
          }
          const newSaleData = newSaleRes.rows[0];
          if (newSaleData.user_id !== targetInvoiceOwnerId) {
            await client.query('ROLLBACK');
            return {
              status: 403,
              data: {
                error:
                  'New linked sale belongs to a different user than the invoice owner.',
              },
            };
          }
          await client.query(
            'UPDATE sales SET invoice_created = true WHERE sales_id = $1',
            [linked_sale_id],
          );
        }
      }

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
            bill_to_country = $16,
            sales_id = $17 
        WHERE invoice_id = $18
        RETURNING *;
      `;

      const invoiceUpdateValues = [
        targetInvoiceOwnerId,
        title,
        bill_to,
        payment_terms,
        due_date,
        notes,
        tax,
        discount,
        shipping,
        receipt_number || null, // Ensure null if empty
        bill_to_address_line1 || null,
        bill_to_address_line2 || null,
        bill_to_city || null,
        bill_to_state || null,
        bill_to_postal_code || null,
        bill_to_country || null,
        linked_sale_id || null,
        invoice_id,
      ];

      const invoiceResult = await client.query(
        invoiceUpdateQuery,
        invoiceUpdateValues,
      );
      if (invoiceResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return {
          status: 404,
          data: { error: 'Receipt not found during update operation.' },
        };
      }

      await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [
        invoice_id,
      ]);

      if (Array.isArray(items) && items.length > 0) {
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
      const updatedInvoiceData = invoiceResult.rows[0];

      const itemsResult = await client.query(
        `SELECT item_id, description, quantity, rate FROM invoice_items WHERE invoice_id = $1`,
        [invoice_id],
      );
      updatedInvoiceData.items = itemsResult.rows;

      return {
        status: 200,
        data: { success: true, invoice: updatedInvoiceData },
      };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error updating receipt:', err);
      if (err.constraint === 'invoices_receipt_number_key' && receipt_number) {
        // Only if receipt_number was provided
        return {
          status: 409,
          data: { error: 'Receipt number already exists.' },
        };
      }
      if (err.constraint === 'invoices_sales_id_unique') {
        return {
          status: 409,
          data: { error: 'This sale is already linked to another invoice.' },
        };
      }
      return { status: 500, data: { error: 'Internal server error' } };
    } finally {
      client.release();
    }
  }

  async resetTable(userId: number): Promise<{ message: string }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const userToReset = parseInt(userId as any, 10);
      if (isNaN(userToReset)) {
        throw new InternalServerErrorException('Invalid user ID for reset.');
      }

      await client.query(
        `
        UPDATE sales s
        SET invoice_created = false
        FROM invoices i
        WHERE i.sales_id = s.sales_id AND i.user_id = $1;
      `,
        [userToReset],
      );

      await client.query('TRUNCATE invoices RESTART IDENTITY CASCADE');
      await client.query('COMMIT');
      return { message: `Receipts (invoices) table reset successfully` };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error resetting receipts table:', error);
      throw new InternalServerErrorException(error.message);
    } finally {
      client.release();
    }
  }
}
