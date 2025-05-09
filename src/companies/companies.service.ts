import { Injectable, InternalServerErrorException } from '@nestjs/common';
import pool from '@/config/database';

@Injectable()
export class CompaniesService {
  async getCompanies(id?: string, limit?: number, offset?: number) {
    try {
      let query = '';
      let params: any[] = [];
      if (id !== undefined) {
        if (isNaN(Number(id))) {
          return { status: 400, data: { error: 'Invalid user ID parameter' } };
        }
        query =
          'SELECT * FROM companies WHERE user_id = $1 ORDER BY created_at DESC';
        params = [Number(id)];
      } else if (limit !== undefined && offset !== undefined) {
        query =
          'SELECT * FROM companies ORDER BY created_at DESC LIMIT $1 OFFSET $2';
        params = [limit, offset];
      } else {
        query = 'SELECT * FROM companies ORDER BY created_at DESC';
        params = [];
      }
      const result = await pool.query(query, params);
      return { status: 200, data: { companies: result.rows } };
    } catch (error) {
      console.error('Error fetching companies', error);
      if (error.code === 'RATE_LIMIT' || error.code === 'RATE_LIMIT_EXCEEDED') {
        return {
          status: 429,
          data: { error: 'Too many requests. Please try again later.' },
        };
      }
      return { status: 500, data: { error: 'Failed to fetch companies' } };
    }
  }

  async addCompany(body: any) {
    const requiredFields = [
      'user_id',
      'company_name',
      'contact_person',
      'email',
      'phone_number',
      'type',
      'address_line_1',
      'city',
      'state',
      'postal_code',
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return { status: 400, data: { error: 'All fields are required' } };
      }
    }

    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(body.phone_number)) {
      return { status: 400, data: { error: 'Invalid phone number format' } };
    }

    const postalRegex = /^\d{6}$/;
    if (!postalRegex.test(body.postal_code)) {
      return { status: 400, data: { error: 'Invalid postal code format' } };
    }

    try {
      const duplicateCheck = await pool.query(
        'SELECT * FROM companies WHERE user_id = $1 AND company_name = $2',
        [body.user_id, body.company_name],
      );
      if (duplicateCheck.rows.length > 0) {
        return {
          status: 400,
          data: { error: 'Company with this name already exists' },
        };
      }

      const insertResult = await pool.query(
        'INSERT INTO companies (user_id, company_name, contact_person, email, phone_number, type, address_line_1, address_line_2, city, state, postal_code, website, industry) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING company_id',
        [
          body.user_id,
          body.company_name,
          body.contact_person,
          body.email,
          body.phone_number,
          body.type,
          body.address_line_1,
          body.address_line_2 || null,
          body.city,
          body.state,
          body.postal_code,
          body.website || null,
          body.industry || null,
        ],
      );
      const company = { company_id: insertResult.rows[0].company_id, ...body };
      return {
        status: 201,
        data: { message: 'Company added successfully', company },
      };
    } catch (error) {
      console.error('Failed to add company', error);
      if (error.code === '23505') {
        return {
          status: 400,
          data: { error: 'Company with this name already exists' },
        };
      } else if (
        error.code === 'RATE_LIMIT' ||
        error.code === 'RATE_LIMIT_EXCEEDED'
      ) {
        return {
          status: 429,
          data: { error: 'Too many requests. Please try again later.' },
        };
      }
      return { status: 500, data: { error: 'Failed to add company' } };
    }
  }

  async deleteCompany(id?: string) {
    if (!id) {
      return { status: 400, data: { error: 'Company ID is required' } };
    }
    if (isNaN(Number(id))) {
      return { status: 400, data: { error: 'Invalid company ID' } };
    }

    try {
      const selectResult = await pool.query(
        'SELECT * FROM companies WHERE company_id = $1',
        [Number(id)],
      );
      if (selectResult.rows.length === 0) {
        return { status: 404, data: { error: 'Company not found' } };
      }
      await pool.query('DELETE FROM companies WHERE company_id = $1', [
        Number(id),
      ]);
      return {
        status: 200,
        data: {
          message: 'Company deleted successfully',
          company: { company_id: Number(id) },
        },
      };
    } catch (error) {
      console.error('Failed to delete company', error);
      return { status: 500, data: { error: 'Failed to delete company' } };
    }
  }

  async updateCompany(body: any) {
    if (!body.id) {
      return { status: 400, data: { error: 'Company ID is required' } };
    }
    if (isNaN(Number(body.id))) {
      return { status: 400, data: { error: 'Invalid company ID' } };
    }

    try {
      const selectResult = await pool.query(
        'SELECT * FROM companies WHERE company_id = $1',
        [Number(body.id)],
      );
      if (selectResult.rows.length === 0) {
        return { status: 404, data: { error: 'Company not found' } };
      }

      const updateResult = await pool.query(
        'UPDATE companies SET company_name = $1, contact_person = $2, email = $3, phone_number = $4, type = $5, address_line_1 = $6, address_line_2 = $7, city = $8, state = $9, postal_code = $10, website = $11, industry = $12 WHERE company_id = $13 RETURNING *',
        [
          body.company_name,
          body.contact_person, // Changed from owner_name
          body.email,
          body.phone_number,
          body.type,
          body.address_line_1,
          body.address_line_2 || null,
          body.city,
          body.state,
          body.postal_code,
          body.website || null, // New
          body.industry || null, // New
          Number(body.id),
        ],
      );
      if (updateResult.rows.length === 0) {
        return {
          status: 409,
          data: { error: 'Conflict: Company was updated by another process' },
        };
      }
      return {
        status: 200,
        data: {
          message: 'Company updated successfully',
          company: updateResult.rows[0],
        },
      };
    } catch (error) {
      console.error('Failed to update company', error);
      return { status: 500, data: { error: 'Failed to update company' } };
    }
  }

  async resetTable(userId: number) {
    try {
      await pool.query('TRUNCATE companies RESTART IDENTITY CASCADE');
      return { message: `Companies table reset for user ${userId}` };
    } catch (error) {
      console.error('Failed to reset companies table', error);
      throw new InternalServerErrorException();
    }
  }
}
