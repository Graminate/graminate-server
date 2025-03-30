// src/contacts/contacts.service.ts
import { Injectable } from '@nestjs/common';
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
      address,
    } = body;

    if (
      !user_id ||
      !first_name ||
      !last_name ||
      !email ||
      !phone_number ||
      !type
    ) {
      return { status: 400, data: { error: 'Missing required fields' } };
    }

    try {
      const result = await pool.query(
        `INSERT INTO contacts (
        user_id, first_name, last_name, email, phone_number, type, address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          user_id,
          first_name,
          last_name,
          email,
          phone_number,
          type,
          address || null,
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
    const { id, first_name, last_name, email, phone_number, address, type } =
      body;

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

      const result = await pool.query(
        `UPDATE contacts 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             email = COALESCE($3, email),
             phone_number = COALESCE($4, phone_number),
             address = COALESCE($5, address),
             type = COALESCE($6, type)
         WHERE contact_id = $7
         RETURNING *`,
        [first_name, last_name, email, phone_number, address, type, parsedId],
      );

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
}
