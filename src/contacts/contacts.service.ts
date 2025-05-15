import { Injectable, InternalServerErrorException } from '@nestjs/common';
import pool from '@/config/database';

@Injectable()
export class ContactsService {
  async getContacts(id?: string) {
    try {
      let result;

      if (id) {
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId)) {
          return {
            status: 400,
            data: { error: 'Invalid user ID parameter' },
          };
        }

        result = await pool.query(
          `SELECT * FROM contacts WHERE user_id = $1 ORDER BY created_at DESC`,
          [parsedId],
        );
      } else {
        result = await pool.query(
          `SELECT * FROM contacts ORDER BY created_at DESC`,
        );
      }

      return { status: 200, data: { contacts: result.rows } };
    } catch (err) {
      console.error('Error fetching contacts:', err);
      return { status: 500, data: { error: 'Failed to fetch contacts' } };
    }
  }

  async addContact(body: any) {
    const {
      user_id,
      first_name,
      last_name,
      email,
      phone_number,
      type,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
    } = body;

    if (
      !user_id ||
      !first_name ||
      !phone_number ||
      !type ||
      !address_line_1 ||
      !city ||
      !state ||
      !postal_code
    ) {
      return { status: 400, data: { error: 'Missing required fields' } };
    }

    try {
      const result = await pool.query(
        `INSERT INTO contacts (
          user_id, first_name, last_name, email, phone_number, type,
          address_line_1, address_line_2, city, state, postal_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          user_id,
          first_name,
          last_name || null,
          email || null,
          phone_number,
          type,
          address_line_1,
          address_line_2 || null,
          city,
          state,
          postal_code,
        ],
      );

      return {
        status: 201,
        data: {
          message: 'Contact added successfully',
          contact: result.rows[0],
        },
      };
    } catch (err) {
      console.error('Error adding contact:', err);
      return { status: 500, data: { error: 'Failed to add contact' } };
    }
  }

  async deleteContact(id: string) {
    const parsedId = parseInt(id, 10);

    if (!id || isNaN(parsedId)) {
      return { status: 400, data: { error: 'Invalid contact ID' } };
    }

    try {
      const result = await pool.query(
        'DELETE FROM contacts WHERE contact_id = $1 RETURNING *',
        [parsedId],
      );

      if (result.rows.length === 0) {
        return { status: 404, data: { error: 'Contact not found' } };
      }

      return {
        status: 200,
        data: {
          message: 'Contact deleted successfully',
          contact: result.rows[0],
        },
      };
    } catch (err) {
      console.error('Error deleting contact:', err);
      return { status: 500, data: { error: 'Failed to delete contact' } };
    }
  }

  async updateContact(body: any) {
    const {
      id,
      first_name,
      last_name,
      email,
      phone_number,
      type,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
    } = body;

    const parsedId = parseInt(id, 10);
    if (!id || isNaN(parsedId)) {
      return { status: 400, data: { error: 'Invalid contact ID' } };
    }

    try {
      const existing = await pool.query(
        'SELECT * FROM contacts WHERE contact_id = $1',
        [parsedId],
      );

      if (existing.rows.length === 0) {
        return { status: 404, data: { error: 'Contact not found' } };
      }

      const sql = `
        UPDATE contacts 
        SET first_name = $1,
            last_name = $2,
            email = $3,
            phone_number = $4,
            type = $5,
            address_line_1 = $6,
            address_line_2 = $7,
            city = $8,
            state = $9,
            postal_code = $10
        WHERE contact_id = $11
        RETURNING *`;

      const params = [
        first_name,
        last_name || null,
        email || null,
        typeof phone_number === 'string' && phone_number.trim() === ''
          ? null
          : phone_number,
        type,
        address_line_1,
        address_line_2 || null,
        city,
        state,
        postal_code,
        parsedId,
      ];

      const result = await pool.query(sql, params);

      return {
        status: 200,
        data: {
          message: 'Contact updated successfully',
          contact: result.rows[0],
        },
      };
    } catch (err) {
      console.error('Error updating contact:', err);
      return { status: 500, data: { error: 'Failed to update contact' } };
    }
  }

  async resetTable(userId: number): Promise<{ message: string }> {
    try {
      await pool.query('TRUNCATE contacts RESTART IDENTITY CASCADE');
      return { message: `Contacts table reset for user ${userId}` };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
