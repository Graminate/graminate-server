import { Injectable, InternalServerErrorException } from '@nestjs/common';
import pool from '@/config/database';
import {
  CreateCattleRearingDto,
  UpdateCattleRearingDto,
} from './cattle-rearing.dto';

@Injectable()
export class CattleRearingService {
  async findByUserId(userId: number): Promise<any[]> {
    try {
      const result = await pool.query(
        'SELECT cattle_id, user_id, cattle_name, cattle_type, number_of_animals, purpose, created_at FROM cattle_rearing WHERE user_id = $1 ORDER BY created_at DESC, cattle_id DESC',
        [userId],
      );
      return result.rows;
    } catch (error) {
      console.error('Error in CattleRearingService.findByUserId:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findById(cattleId: number): Promise<any> {
    try {
      const result = await pool.query(
        'SELECT cattle_id, user_id, cattle_name, cattle_type, number_of_animals, purpose, created_at FROM cattle_rearing WHERE cattle_id = $1',
        [cattleId],
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in CattleRearingService.findById:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async create(createDto: CreateCattleRearingDto): Promise<any> {
    const { user_id, cattle_name, cattle_type, number_of_animals, purpose } =
      createDto;
    try {
      const result = await pool.query(
        `INSERT INTO cattle_rearing (user_id, cattle_name, cattle_type, number_of_animals, purpose)
         VALUES ($1, $2, $3, $4, $5) RETURNING cattle_id, user_id, cattle_name, cattle_type, number_of_animals, purpose, created_at`,
        [user_id, cattle_name, cattle_type, number_of_animals, purpose],
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in CattleRearingService.create:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateDto: UpdateCattleRearingDto): Promise<any> {
    const { cattle_name, cattle_type, number_of_animals, purpose } = updateDto;
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];
    let query = 'UPDATE cattle_rearing SET ';

    if (cattle_name !== undefined) {
      fieldsToUpdate.push(`cattle_name = $${fieldsToUpdate.length + 1}`);
      values.push(cattle_name);
    }
    if (cattle_type !== undefined) {
      fieldsToUpdate.push(`cattle_type = $${fieldsToUpdate.length + 1}`);
      values.push(cattle_type);
    }
    if (number_of_animals !== undefined) {
      fieldsToUpdate.push(`number_of_animals = $${fieldsToUpdate.length + 1}`);
      values.push(number_of_animals);
    }
    if (purpose !== undefined) {
      fieldsToUpdate.push(`purpose = $${fieldsToUpdate.length + 1}`);
      values.push(purpose);
    }

    if (fieldsToUpdate.length === 0) {
      return this.findById(id);
    }

    query += fieldsToUpdate.join(', ');
    query += ` WHERE cattle_id = $${fieldsToUpdate.length + 1} RETURNING cattle_id, user_id, cattle_name, cattle_type, number_of_animals, purpose, created_at`;
    values.push(id);

    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in CattleRearingService.update:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM cattle_rearing WHERE cattle_id = $1',
        [id],
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in CattleRearingService.delete:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async resetTable(userId: number): Promise<{ message: string }> {
    try {
      await pool.query('TRUNCATE cattle_rearing RESTART IDENTITY CASCADE');
      return { message: `Cattle table reset for user ${userId}` };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
