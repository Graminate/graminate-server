import { Injectable, InternalServerErrorException } from '@nestjs/common';
import pool from '@/config/database';
import {
  CreatePoultryHealthDto,
  UpdatePoultryHealthDto,
} from './poultry-health.dto';

interface PoultryHealthFilters {
  limit?: number;
  offset?: number;
  flockId?: number;
}

@Injectable()
export class PoultryHealthService {
  async findByUserIdWithFilters(
    userId: number,
    filters: PoultryHealthFilters,
  ): Promise<any[]> {
    const { limit, offset, flockId } = filters;
    let query = 'SELECT * FROM poultry_health WHERE user_id = $1';
    const queryParams: any[] = [userId];
    let paramIndex = 2;

    if (flockId !== undefined) {
      query += ` AND flock_id = $${paramIndex}`;
      queryParams.push(flockId);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC, poultry_health_id DESC';

    if (limit !== undefined) {
      query += ` LIMIT $${paramIndex}`;
      queryParams.push(limit);
      paramIndex++;
    }

    if (offset !== undefined) {
      query += ` OFFSET $${paramIndex}`;
      queryParams.push(offset);
    }

    try {
      const result = await pool.query(query, queryParams);
      return result.rows;
    } catch (error) {
      console.error(
        'Error executing query in findByUserIdWithFilters (PoultryHealth):',
        error,
        query,
        queryParams,
      );
      throw new InternalServerErrorException(
        `Database query failed: ${error.message}`,
      );
    }
  }

  async findById(id: number): Promise<any> {
    try {
      const result = await pool.query(
        'SELECT * FROM poultry_health WHERE poultry_health_id = $1',
        [id],
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error(
        'Error executing query in findById (PoultryHealth):',
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  async create(createDto: CreatePoultryHealthDto): Promise<any> {
    const {
      user_id,
      flock_id,
      veterinary_name,
      total_birds,
      birds_vaccinated,
      vaccines_given,
      symptoms,
      medicine_approved,
      remarks,
      next_appointment,
    } = createDto;
    try {
      const result = await pool.query(
        `INSERT INTO poultry_health (user_id, flock_id, veterinary_name, total_birds, birds_vaccinated, vaccines_given, symptoms, medicine_approved, remarks, next_appointment)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          user_id,
          flock_id,
          veterinary_name,
          total_birds,
          birds_vaccinated,
          vaccines_given,
          symptoms,
          medicine_approved,
          remarks,
          next_appointment,
        ],
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error executing query in create (PoultryHealth):', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateDto: UpdatePoultryHealthDto): Promise<any> {
    const {
      veterinary_name,
      total_birds,
      birds_vaccinated,
      vaccines_given,
      symptoms,
      medicine_approved,
      remarks,
      next_appointment,
    } = updateDto;
    try {
      const result = await pool.query(
        `UPDATE poultry_health SET
            veterinary_name = COALESCE($1, veterinary_name),
            total_birds = COALESCE($2, total_birds),
            birds_vaccinated = COALESCE($3, birds_vaccinated),
            vaccines_given = COALESCE($4, vaccines_given),
            symptoms = COALESCE($5, symptoms),
            medicine_approved = COALESCE($6, medicine_approved),
            remarks = COALESCE($7, remarks),
            next_appointment = COALESCE($8, next_appointment)
         WHERE poultry_health_id = $9 RETURNING *`,
        [
          veterinary_name,
          total_birds,
          birds_vaccinated,
          vaccines_given,
          symptoms,
          medicine_approved,
          remarks,
          next_appointment,
          id,
        ],
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error executing query in update (PoultryHealth):', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM poultry_health WHERE poultry_health_id = $1',
        [id],
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error executing query in delete (PoultryHealth):', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async resetTable(userId: number): Promise<{ message: string }> {
    try {
      await pool.query('TRUNCATE poultry_health RESTART IDENTITY CASCADE');
      return { message: `Poultry Health table reset for user ${userId}` };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
