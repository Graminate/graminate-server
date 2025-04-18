import { Injectable, InternalServerErrorException } from '@nestjs/common';
import pool from '@/config/database';
import { CreateContractDto, UpdateContractDto } from './contracts.dto';

@Injectable()
export class ContractsService {
  async getContracts(userId?: number, page?: number, limit?: number) {
    let query = 'SELECT * FROM deals';
    const params: any[] = [];

    if (userId !== undefined) {
      if (isNaN(userId) || userId <= 0) {
        return { status: 400, data: { error: 'Invalid User ID parameter' } };
      }
      query += ' WHERE user_id = $1';
      params.push(userId);
    }

    query += ' ORDER BY start_date DESC';

    if (limit && page) {
      const offset = (page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    try {
      const result = await pool.query(query, params);
      return { status: 200, data: { contracts: result.rows } };
    } catch (err) {
      console.error('Error fetching contracts:', err);
      return { status: 500, data: { error: 'Failed to fetch contracts' } };
    }
  }

  async addContract(createContractDto: CreateContractDto) {
    const { user_id, deal_name, partner, amount, stage, start_date, end_date } =
      createContractDto;

    try {
      const result = await pool.query(
        `INSERT INTO deals (user_id, deal_name, partner, amount, stage, start_date, end_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          user_id,
          deal_name,
          partner,
          amount,
          stage,
          start_date,
          end_date || null,
        ],
      );

      return {
        status: 201,
        data: {
          message: 'Contract added successfully',
          contract: result.rows[0],
        },
      };
    } catch (err) {
      return { status: 500, data: { error: 'Failed to add contract' } };
    }
  }

  async deleteContract(id: number) {
    if (isNaN(id) || id <= 0) {
      return { status: 400, data: { error: 'Invalid contract (deal) ID' } };
    }

    try {
      const result = await pool.query(
        'DELETE FROM deals WHERE deal_id = $1 RETURNING *',
        [id],
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

  async updateContract(updateContractDto: UpdateContractDto) {
    const { id, deal_name, partner, amount, stage, start_date, end_date } =
      updateContractDto;

    if (isNaN(id) || id <= 0) {
      return { status: 400, data: { error: 'Invalid contract (deal) ID' } };
    }

    const updateFields = [
      deal_name,
      partner,
      amount,
      stage,
      start_date,
      end_date,
    ];
    if (updateFields.every((field) => field === undefined)) {
      return { status: 400, data: { error: 'No update data provided' } };
    }

    try {
      const existing = await pool.query(
        'SELECT deal_id FROM deals WHERE deal_id = $1',
        [id],
      );
      if (existing.rows.length === 0) {
        return { status: 404, data: { error: 'Contract not found' } };
      }

      const setClauses: string[] = [];
      const values: any[] = [];
      let valueIndex = 1;

      if (deal_name !== undefined) {
        setClauses.push(`deal_name = $${valueIndex++}`);
        values.push(deal_name);
      }
      if (partner !== undefined) {
        setClauses.push(`partner = $${valueIndex++}`);
        values.push(partner);
      }
      if (amount !== undefined) {
        setClauses.push(`amount = $${valueIndex++}`);
        values.push(amount);
      }
      if (stage !== undefined) {
        setClauses.push(`stage = $${valueIndex++}`);
        values.push(stage);
      }
      if (start_date !== undefined) {
        setClauses.push(`start_date = $${valueIndex++}`);
        values.push(start_date);
      }
      if (end_date !== undefined) {
        setClauses.push(`end_date = $${valueIndex++}`);
        values.push(end_date);
      }

      if (setClauses.length === 0) {
        return { status: 400, data: { error: 'No update data provided' } };
      }

      values.push(id);

      const query = `UPDATE deals SET ${setClauses.join(', ')} WHERE deal_id = $${valueIndex} RETURNING *`;
      const result = await pool.query(query, values);

      if (!result.rows[0]) {
        return {
          status: 404,
          data: { error: 'Contract not found or failed to update' },
        };
      }

      return {
        status: 200,
        data: {
          message: 'Contract updated successfully',
          contract: result.rows[0],
        },
      };
    } catch (err) {
      return { status: 500, data: { error: 'Failed to update contract' } };
    }
  }

  async resetTable(userId: number): Promise<{ message: string }> {
    try {
      await pool.query('TRUNCATE deals RESTART IDENTITY CASCADE');
      return { message: `Contracts (deals) table reset initiated by user ${userId}`};
    } catch (error) {
      throw new InternalServerErrorException('Failed to reset contracts table');
    }
  }
}
