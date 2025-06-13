import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import pool from '@/config/database';
import { CreateFisheryDto, UpdateFisheryDto } from './fishery.dto';

@Injectable()
export class FisheryService {
  async findByUserId(userId: number): Promise<any[]> {
    try {
      const result = await pool.query(
        'SELECT fishery_id, user_id, fishery_type, target_species, feed_type, notes, created_at FROM fishery WHERE user_id = $1 ORDER BY created_at DESC, fishery_id DESC',
        [userId],
      );
      return result.rows;
    } catch (error) {
      console.error('Error in FisheryService.findByUserId:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findById(fisheryId: number): Promise<any> {
    try {
      const result = await pool.query(
        'SELECT fishery_id, user_id, fishery_type, target_species, feed_type, notes, created_at FROM fishery WHERE fishery_id = $1',
        [fisheryId],
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in FisheryService.findById:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async create(createDto: CreateFisheryDto): Promise<any> {
    const { user_id, fishery_type, target_species, feed_type, notes } =
      createDto;
    try {
      const result = await pool.query(
        `INSERT INTO fishery (user_id, fishery_type, target_species, feed_type, notes)
         VALUES ($1, $2, $3, $4, $5) RETURNING fishery_id, user_id, fishery_type, target_species, feed_type, notes, created_at`,
        [user_id, fishery_type, target_species, feed_type, notes],
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in FisheryService.create:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateDto: UpdateFisheryDto): Promise<any> {
    const { fishery_type, target_species, feed_type, notes } = updateDto;
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];
    let query = 'UPDATE fishery SET ';

    if (fishery_type !== undefined) {
      fieldsToUpdate.push(`fishery_type = $${fieldsToUpdate.length + 1}`);
      values.push(fishery_type);
    }
    if (target_species !== undefined) {
      fieldsToUpdate.push(`target_species = $${fieldsToUpdate.length + 1}`);
      values.push(target_species);
    }
    if (feed_type !== undefined) {
      fieldsToUpdate.push(`feed_type = $${fieldsToUpdate.length + 1}`);
      values.push(feed_type);
    }
    if (notes !== undefined) {
      fieldsToUpdate.push(`notes = $${fieldsToUpdate.length + 1}`);
      values.push(notes);
    }

    if (fieldsToUpdate.length === 0) {
      const existingFishery = await this.findById(id);
      if (!existingFishery) {
        throw new NotFoundException('Fishery not found');
      }
      return existingFishery;
    }

    query += fieldsToUpdate.join(', ');
    query += ` WHERE fishery_id = $${fieldsToUpdate.length + 1} RETURNING fishery_id, user_id, fishery_type, target_species, feed_type, notes, created_at`;
    values.push(id);

    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in FisheryService.update:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM fishery WHERE fishery_id = $1',
        [id],
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in FisheryService.delete:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async resetTable(): Promise<{ message: string }> {
    try {
      await pool.query('TRUNCATE fishery RESTART IDENTITY CASCADE');
      return { message: `Fishery table has been completely reset.` };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async resetForUser(userId: number): Promise<{ message: string }> {
    try {
      await pool.query('DELETE FROM fishery WHERE user_id = $1', [userId]);
      return { message: `Fishery data reset for user ${userId}` };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
