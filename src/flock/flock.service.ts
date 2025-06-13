import { Injectable, InternalServerErrorException } from '@nestjs/common';
import pool from '@/config/database';
import { CreateFlockDto, UpdateFlockDto } from './flock.dto';

@Injectable()
export class FlockService {
  async findByUserId(userId: number): Promise<any[]> {
    try {
      const result = await pool.query(
        'SELECT flock_id, user_id, flock_name, flock_type, quantity, created_at, breed, source, housing_type, notes FROM poultry_flock WHERE user_id = $1 ORDER BY created_at DESC, flock_id DESC',
        [userId],
      );
      return result.rows;
    } catch (error) {
      console.error('Error in FlockService.findByUserId:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findById(flockId: number): Promise<any> {
    try {
      const result = await pool.query(
        'SELECT flock_id, user_id, flock_name, flock_type, quantity, created_at, breed, source, housing_type, notes FROM poultry_flock WHERE flock_id = $1',
        [flockId],
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in FlockService.findById:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async create(createDto: CreateFlockDto): Promise<any> {
    const {
      user_id,
      flock_name,
      flock_type,
      quantity,
      breed,
      source,
      housing_type,
      notes,
    } = createDto;
    try {
      const result = await pool.query(
        `INSERT INTO poultry_flock (user_id, flock_name, flock_type, quantity, breed, source, housing_type, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING flock_id, user_id, flock_name, flock_type, quantity, created_at, breed, source, housing_type, notes`,
        [
          user_id,
          flock_name,
          flock_type,
          quantity,
          breed,
          source,
          housing_type,
          notes,
        ],
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in FlockService.create:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateDto: UpdateFlockDto): Promise<any> {
    const {
      flock_name,
      flock_type,
      quantity,
      breed,
      source,
      housing_type,
      notes,
    } = updateDto;
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];
    let query = 'UPDATE poultry_flock SET ';

    if (flock_name !== undefined) {
      fieldsToUpdate.push(`flock_name = $${fieldsToUpdate.length + 1}`);
      values.push(flock_name);
    }
    if (flock_type !== undefined) {
      fieldsToUpdate.push(`flock_type = $${fieldsToUpdate.length + 1}`);
      values.push(flock_type);
    }
    if (quantity !== undefined) {
      fieldsToUpdate.push(`quantity = $${fieldsToUpdate.length + 1}`);
      values.push(quantity);
    }
    if (breed !== undefined) {
      fieldsToUpdate.push(`breed = $${fieldsToUpdate.length + 1}`);
      values.push(breed);
    }
    if (source !== undefined) {
      fieldsToUpdate.push(`source = $${fieldsToUpdate.length + 1}`);
      values.push(source);
    }
    if (housing_type !== undefined) {
      fieldsToUpdate.push(`housing_type = $${fieldsToUpdate.length + 1}`);
      values.push(housing_type);
    }
    if (notes !== undefined) {
      fieldsToUpdate.push(`notes = $${fieldsToUpdate.length + 1}`);
      values.push(notes);
    }

    if (fieldsToUpdate.length === 0) {
      return this.findById(id);
    }

    query += fieldsToUpdate.join(', ');
    query += ` WHERE flock_id = $${fieldsToUpdate.length + 1} RETURNING flock_id, user_id, flock_name, flock_type, quantity, created_at, breed, source, housing_type, notes`;
    values.push(id);

    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in FlockService.update:', error);
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
      console.error('Error in FlockService.delete:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async resetTable(): Promise<{ message: string }> {
    try {
      await pool.query('TRUNCATE poultry_flock RESTART IDENTITY CASCADE');
      return { message: 'Poultry flock table has been completely reset.' };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
  
  async resetForUser(userId: number): Promise<{ message: string }> {
    try {
      await pool.query('DELETE FROM poultry_flock WHERE user_id = $1', [
        userId,
      ]);
      return { message: `Poultry flock data reset for user ${userId}` };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
