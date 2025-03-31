import { Injectable, InternalServerErrorException } from '@nestjs/common';
import pool from '@/config/database';

@Injectable()
export class ContractsService {
  async getContracts(userId: string) {
    try {
      const parsedId = parseInt(userId, 10);
      if (isNaN(parsedId)) {
        return { status: 400, data: { error: 'Invalid userId parameter' } };
      }

      const result = await pool.query(
        `SELECT * FROM deals WHERE user_id = $1 ORDER BY start_date DESC`,
        [parsedId],
      );

      return { status: 200, data: { contracts: result.rows } };
    } catch (err) {
      console.error('Error fetching contracts:', err);
      return { status: 500, data: { error: 'Failed to fetch contracts' } };
    }
  }

  async addContract(body: any) {
    const { user_id, deal_name, partner, amount, stage, start_date, end_date } =
      body;

    try {
      const result = await pool.query(
        `INSERT INTO deals (user_id, deal_name, partner, amount, stage, start_date, end_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [user_id, deal_name, partner, amount, stage, start_date, end_date],
      );

      return {
        status: 201,
        data: {
          message: 'Contract added successfully',
          contract: result.rows[0],
        },
      };
    } catch (err) {
      console.error('Error adding contract:', err);
      return { status: 500, data: { error: 'Failed to add contract' } };
    }
  }

  async deleteContract(id: string) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return { status: 400, data: { error: 'Invalid deal ID' } };
    }

    try {
      const result = await pool.query(
        'DELETE FROM deals WHERE deal_id = $1 RETURNING *',
        [parsedId],
      );

      if (result.rows.length === 0) {
        return { status: 404, data: { error: 'Contract not found' } };
      }

      return {
        status: 200,
        data: {
          message: 'Contract deleted successfully',
          contract: result.rows[0],
        },
      };
    } catch (err) {
      console.error('Error deleting contract:', err);
      return { status: 500, data: { error: 'Failed to delete contract' } };
    }
  }

  async updateContract(body: any) {
    const { id, deal_name, partner, amount, stage, start_date, end_date } =
      body;
    const parsedId = parseInt(id, 10);

    if (!id || isNaN(parsedId)) {
      return { status: 400, data: { error: 'Invalid contract ID' } };
    }

    try {
      const existing = await pool.query(
        'SELECT * FROM deals WHERE deal_id = $1',
        [parsedId],
      );
      if (existing.rows.length === 0) {
        return { status: 404, data: { error: 'Contract not found' } };
      }

      const result = await pool.query(
        `UPDATE deals 
         SET deal_name = COALESCE($1, deal_name),
             partner = COALESCE($2, partner),
             amount = COALESCE($3, amount),
             stage = COALESCE($4, stage),
             start_date = COALESCE($5, start_date),
             end_date = COALESCE($6, end_date)
         WHERE deal_id = $7
         RETURNING *`,
        [deal_name, partner, amount, stage, start_date, end_date, parsedId],
      );

      return {
        status: 200,
        data: {
          message: 'Contract updated successfully',
          contract: result.rows[0],
        },
      };
    } catch (err) {
      console.error('Error updating contract:', err);
      return { status: 500, data: { error: 'Failed to update contract' } };
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
