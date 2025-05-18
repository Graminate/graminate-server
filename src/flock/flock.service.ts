import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import pool from '@/config/database';
import { CreateFlockDto, UpdateFlockDto } from './flock.dto';

@Injectable()
export class FlockService {
  async findByUserId(userId: number): Promise<any[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM poultry_flock WHERE user_id = $1 ORDER BY date_created DESC, created_at DESC',
        [userId],
      );
      return result.rows;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findById(flockId: number): Promise<any> {
    try {
      const result = await pool.query(
        'SELECT * FROM poultry_flock WHERE flock_id = $1',
        [flockId],
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async create(createDto: CreateFlockDto): Promise<any> {
    const { user_id, flock_name, flock_type, quantity, date_created } =
      createDto;
    try {
      const result = await pool.query(
        `INSERT INTO poultry_flock (user_id, flock_name, flock_type, quantity, date_created)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [user_id, flock_name, flock_type, quantity, date_created],
      );
      return result.rows[0];
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateDto: UpdateFlockDto): Promise<any> {
    const { flock_name, flock_type, quantity, date_created } = updateDto;
    try {
      const result = await pool.query(
        `UPDATE poultry_flock SET
          flock_name = COALESCE($1, flock_name),
          flock_type = COALESCE($2, flock_type),
          quantity = COALESCE($3, quantity),
          date_created = COALESCE($4, date_created)
        WHERE flock_id = $5 RETURNING *`,
        [flock_name, flock_type, quantity, date_created, id],
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM poultry_flock WHERE flock_id = $1',
        [id],
      );
      return result.rowCount > 0;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async resetTable(userId: number): Promise<{ message: string }> {
    try {
      await pool.query('TRUNCATE poultry_flock RESTART IDENTITY CASCADE');
      return { message: `Flock table reset for user ${userId}` };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
