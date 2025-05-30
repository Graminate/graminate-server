import { Injectable, InternalServerErrorException } from '@nestjs/common';
import pool from '@/config/database';
import {
  CreatePoultryFeedDto,
  UpdatePoultryFeedDto,
} from './poultry-feeds.dto';

interface PoultryFeedFilters {
  limit?: number;
  offset?: number;
  flockId?: number;
}

@Injectable()
export class PoultryFeedsService {
  async findByUserIdWithFilters(
    userId: number,
    filters: PoultryFeedFilters,
  ): Promise<any[]> {
    const { limit, offset, flockId } = filters;
    let query = 'SELECT * FROM poultry_feeds WHERE user_id = $1';
    const queryParams: any[] = [userId];
    let paramIndex = 2;

    if (flockId !== undefined) {
      query += ` AND flock_id = $${paramIndex}`;
      queryParams.push(flockId);
      paramIndex++;
    }

    query += ' ORDER BY feed_date DESC, created_at DESC, feed_id DESC';

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
        'Error executing query in findByUserIdWithFilters (PoultryFeeds):',
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
        'SELECT * FROM poultry_feeds WHERE feed_id = $1',
        [id],
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error executing query in findById (PoultryFeeds):', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async create(createDto: CreatePoultryFeedDto): Promise<any> {
    const { user_id, flock_id, feed_given, amount_given, units, feed_date } =
      createDto;
    try {
      const result = await pool.query(
        `INSERT INTO poultry_feeds (user_id, flock_id, feed_given, amount_given, units, feed_date)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [user_id, flock_id, feed_given, amount_given, units, feed_date],
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error executing query in create (PoultryFeeds):', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateDto: UpdatePoultryFeedDto): Promise<any> {
    const { feed_given, amount_given, units, feed_date } = updateDto;
    try {
      const result = await pool.query(
        `UPDATE poultry_feeds SET
            feed_given = COALESCE($1, feed_given),
            amount_given = COALESCE($2, amount_given),
            units = COALESCE($3, units),
            feed_date = COALESCE($4, feed_date)
         WHERE feed_id = $5 RETURNING *`,
        [feed_given, amount_given, units, feed_date, id],
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error executing query in update (PoultryFeeds):', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM poultry_feeds WHERE feed_id = $1',
        [id],
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error executing query in delete (PoultryFeeds):', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async resetTable(userId: number): Promise<{ message: string }> {
    try {
      await pool.query('TRUNCATE poultry_feeds RESTART IDENTITY CASCADE');
      return { message: `Poultry Feeds table reset for user ${userId}` };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
