import { Injectable, InternalServerErrorException } from '@nestjs/common';
import pool from '@/config/database';
import { CreatePoultryEggDto, UpdatePoultryEggDto } from './poultry-eggs.dto';

interface PoultryEggFilters {
  limit?: number;
  offset?: number;
  flockId?: number;
}

@Injectable()
export class PoultryEggsService {
  async findByUserIdWithFilters(
    userId: number,
    filters: PoultryEggFilters,
  ): Promise<any[]> {
    const { limit, offset, flockId } = filters;
    let query = 'SELECT * FROM poultry_eggs WHERE user_id = $1';
    const queryParams: any[] = [userId];
    let paramIndex = 2;

    if (flockId !== undefined) {
      query += ` AND flock_id = $${paramIndex}`;
      queryParams.push(flockId);
      paramIndex++;
    }

    query += ' ORDER BY date_logged DESC, egg_id DESC';

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
        'Error executing query in findByUserIdWithFilters (PoultryEggs):',
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
        'SELECT * FROM poultry_eggs WHERE egg_id = $1',
        [id],
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error executing query in findById (PoultryEggs):', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async create(createDto: CreatePoultryEggDto): Promise<any> {
    const {
      user_id,
      flock_id,
      date_collected,
      small_eggs = 0,
      medium_eggs = 0,
      large_eggs = 0,
      extra_large_eggs = 0,
      broken_eggs = 0,
    } = createDto;

    const total_eggs = small_eggs + medium_eggs + large_eggs + extra_large_eggs;

    try {
      const result = await pool.query(
        `INSERT INTO poultry_eggs (user_id, flock_id, date_collected, small_eggs, medium_eggs, large_eggs, extra_large_eggs, total_eggs, broken_eggs)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          user_id,
          flock_id,
          date_collected,
          small_eggs,
          medium_eggs,
          large_eggs,
          extra_large_eggs,
          total_eggs,
          broken_eggs,
        ],
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error executing query in create (PoultryEggs):', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateDto: UpdatePoultryEggDto): Promise<any> {
    const {
      date_collected,
      small_eggs,
      medium_eggs,
      large_eggs,
      extra_large_eggs,
      broken_eggs,
    } = updateDto;

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (date_collected !== undefined) {
      fieldsToUpdate.push(`date_collected = $${paramCount++}`);
      values.push(date_collected);
    }
    if (small_eggs !== undefined) {
      fieldsToUpdate.push(`small_eggs = $${paramCount++}`);
      values.push(small_eggs);
    }
    if (medium_eggs !== undefined) {
      fieldsToUpdate.push(`medium_eggs = $${paramCount++}`);
      values.push(medium_eggs);
    }
    if (large_eggs !== undefined) {
      fieldsToUpdate.push(`large_eggs = $${paramCount++}`);
      values.push(large_eggs);
    }
    if (extra_large_eggs !== undefined) {
      fieldsToUpdate.push(`extra_large_eggs = $${paramCount++}`);
      values.push(extra_large_eggs);
    }
    if (broken_eggs !== undefined) {
      fieldsToUpdate.push(`broken_eggs = $${paramCount++}`);
      values.push(broken_eggs);
    }

    if (fieldsToUpdate.length === 0) {
      const currentRecord = await this.findById(id);
      if (!currentRecord) return null; // Or throw NotFoundException
      return currentRecord;
    }

    const hasEggCountChange = [
      small_eggs,
      medium_eggs,
      large_eggs,
      extra_large_eggs,
    ].some((val) => val !== undefined);

    if (hasEggCountChange) {
      fieldsToUpdate.push(
        `total_eggs = COALESCE($${values.indexOf(small_eggs) + 1}, small_eggs) + 
                       COALESCE($${values.indexOf(medium_eggs) + 1}, medium_eggs) + 
                       COALESCE($${values.indexOf(large_eggs) + 1}, large_eggs) + 
                       COALESCE($${values.indexOf(extra_large_eggs) + 1}, extra_large_eggs)`,
      );

      const currentRecord = await this.findById(id);
      if (!currentRecord) {
        return null;
      }

      const newSmall =
        small_eggs !== undefined ? small_eggs : currentRecord.small_eggs;
      const newMedium =
        medium_eggs !== undefined ? medium_eggs : currentRecord.medium_eggs;
      const newLarge =
        large_eggs !== undefined ? large_eggs : currentRecord.large_eggs;
      const newExtraLarge =
        extra_large_eggs !== undefined
          ? extra_large_eggs
          : currentRecord.extra_large_eggs;
      const newTotalEggs = newSmall + newMedium + newLarge + newExtraLarge;

      // Check if total_eggs is already in fieldsToUpdate to avoid duplicate. It shouldn't be.
      fieldsToUpdate.push(`total_eggs = $${paramCount++}`);
      values.push(newTotalEggs);
    }

    const query = `UPDATE poultry_eggs SET ${fieldsToUpdate.join(', ')} WHERE egg_id = $${paramCount} RETURNING *`;
    values.push(id);

    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error(
        'Error executing query in update (PoultryEggs):',
        error,
        query,
        values,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM poultry_eggs WHERE egg_id = $1',
        [id],
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error executing query in delete (PoultryEggs):', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async resetTable(userId: number): Promise<{ message: string }> {
    try {
      await pool.query('TRUNCATE poultry_eggs RESTART IDENTITY CASCADE');
      return { message: `Poultry Eggs table reset for user ${userId}` };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
