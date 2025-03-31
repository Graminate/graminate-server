import { Injectable, InternalServerErrorException } from '@nestjs/common';
import pool from '@/config/database';

@Injectable()
export class CompaniesService {
  async getCompanies(id?: string) {
    try {
      let result;

      if (id) {
        const parsedUserId = parseInt(id, 10);
        if (isNaN(parsedUserId)) {
          return { status: 400, data: { error: 'Invalid user ID parameter' } };
        }

        result = await pool.query(
          `SELECT * FROM companies WHERE user_id = $1 ORDER BY created_at DESC`,
          [parsedUserId],
        );
      } else {
        result = await pool.query(
          `SELECT * FROM companies ORDER BY created_at DESC`,
        );
      }

      return { status: 200, data: { companies: result.rows } };
    } catch (err) {
      console.error('Error fetching companies:', err);
      return { status: 500, data: { error: 'Failed to fetch companies' } };
    }
  }

  async addCompany(body: any) {
    const {
      user_id,
      company_name,
      owner_name,
      email,
      phone_number,
      address,
      type,
    } = body;

    if (
      !user_id ||
      !company_name ||
      !owner_name ||
      !email ||
      !phone_number ||
      !address ||
      !type
    ) {
      return { status: 400, data: { error: 'All fields are required' } };
    }

    try {
      const result = await pool.query(
        `INSERT INTO companies (user_id, company_name, owner_name, email, phone_number, address, type) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [user_id, company_name, owner_name, email, phone_number, address, type],
      );

      return {
        status: 201,
        data: {
          message: 'Company added successfully',
          company: result.rows[0],
        },
      };
    } catch (err) {
      console.error('Error adding company:', err);
      return { status: 500, data: { error: 'Failed to add company' } };
    }
  }

  async deleteCompany(id?: string) {
    if (!id) {
      return { status: 400, data: { error: 'Company ID is required' } };
    }

    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return { status: 400, data: { error: 'Invalid company ID' } };
    }

    try {
      const result = await pool.query(
        'DELETE FROM companies WHERE company_id = $1 RETURNING *',
        [parsedId],
      );

      if (result.rows.length === 0) {
        return { status: 404, data: { error: 'Company not found' } };
      }

      return {
        status: 200,
        data: {
          message: 'Company deleted successfully',
          company: result.rows[0],
        },
      };
    } catch (err) {
      console.error('Error deleting company:', err);
      return { status: 500, data: { error: 'Failed to delete company' } };
    }
  }

  async updateCompany(body: any) {
    const { id, company_name, owner_name, email, phone_number, address, type } =
      body;

    if (!id) {
      return { status: 400, data: { error: 'Company ID is required' } };
    }

    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return { status: 400, data: { error: 'Invalid company ID' } };
    }

    try {
      const existing = await pool.query(
        'SELECT * FROM companies WHERE company_id = $1',
        [parsedId],
      );

      if (existing.rows.length === 0) {
        return { status: 404, data: { error: 'Company not found' } };
      }

      const result = await pool.query(
        `UPDATE companies 
         SET company_name = COALESCE($1, company_name),
             owner_name = COALESCE($2, owner_name),
             email = COALESCE($3, email),
             phone_number = COALESCE($4, phone_number),
             address = COALESCE($5, address),
             type = COALESCE($6, type)
         WHERE company_id = $7
         RETURNING *`,
        [
          company_name,
          owner_name,
          email,
          phone_number,
          address,
          type,
          parsedId,
        ],
      );

      return {
        status: 200,
        data: {
          message: 'Company updated successfully',
          company: result.rows[0],
        },
      };
    } catch (err) {
      console.error('Error updating company:', err);
      return { status: 500, data: { error: 'Failed to update company' } };
    }
  }

  async resetTable(userId: number): Promise<{ message: string }> {
    try {
      await pool.query('TRUNCATE companies RESTART IDENTITY CASCADE');
      return { message: `Companies table reset for user ${userId}` };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
