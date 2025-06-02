import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import pool from '@/config/database';
import { CreateCattleMilkDto, UpdateCattleMilkDto } from './cattle-milk.dto';

@Injectable()
export class CattleMilkService {
  async findByUserId(userId: number): Promise<any[]> {
    try {
      const result = await pool.query(
        'SELECT milk_id, cattle_id, user_id, date_collected, animal_name, milk_produced, date_logged FROM cattle_milk WHERE user_id = $1 ORDER BY date_collected DESC, milk_id DESC',
        [userId],
      );
      return result.rows;
    } catch (error) {
      console.error('Error in CattleMilkService.findByUserId:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findByCattleId(cattleId: number): Promise<any[]> {
    try {
      const result = await pool.query(
        'SELECT milk_id, cattle_id, user_id, date_collected, animal_name, milk_produced, date_logged FROM cattle_milk WHERE cattle_id = $1 ORDER BY date_collected DESC, milk_id DESC',
        [cattleId],
      );
      return result.rows;
    } catch (error) {
      console.error('Error in CattleMilkService.findByCattleId:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findById(milkId: number): Promise<any> {
    try {
      const result = await pool.query(
        'SELECT milk_id, cattle_id, user_id, date_collected, animal_name, milk_produced, date_logged FROM cattle_milk WHERE milk_id = $1',
        [milkId],
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in CattleMilkService.findById:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async create(createDto: CreateCattleMilkDto): Promise<any> {
    const { user_id, cattle_id, date_collected, animal_name, milk_produced } =
      createDto;
    try {
      const result = await pool.query(
        `INSERT INTO cattle_milk (user_id, cattle_id, date_collected, animal_name, milk_produced)
         VALUES ($1, $2, $3, $4, $5) RETURNING milk_id, cattle_id, user_id, date_collected, animal_name, milk_produced, date_logged`,
        [user_id, cattle_id, date_collected, animal_name, milk_produced],
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in CattleMilkService.create:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateDto: UpdateCattleMilkDto): Promise<any> {
    const { date_collected, animal_name, milk_produced } = updateDto;
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];
    let query = 'UPDATE cattle_milk SET ';

    if (date_collected !== undefined) {
      fieldsToUpdate.push(`date_collected = $${fieldsToUpdate.length + 1}`);
      values.push(date_collected);
    }
    if (animal_name !== undefined) {
      fieldsToUpdate.push(`animal_name = $${fieldsToUpdate.length + 1}`);
      values.push(animal_name);
    }
    if (milk_produced !== undefined) {
      fieldsToUpdate.push(`milk_produced = $${fieldsToUpdate.length + 1}`);
      values.push(milk_produced);
    }

    if (fieldsToUpdate.length === 0) {
      return this.findById(id);
    }

    query += fieldsToUpdate.join(', ');
    query += ` WHERE milk_id = $${fieldsToUpdate.length + 1} RETURNING milk_id, cattle_id, user_id, date_collected, animal_name, milk_produced, date_logged`;
    values.push(id);

    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in CattleMilkService.update:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM cattle_milk WHERE milk_id = $1',
        [id],
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in CattleMilkService.delete:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async resetRecordsByUserId(
    userId: number,
  ): Promise<{ message: string; count: number }> {
    try {
      const result = await pool.query(
        'DELETE FROM cattle_milk WHERE user_id = $1',
        [userId],
      );
      return {
        message: `Cattle milk records reset for user ${userId}`,
        count: result.rowCount,
      };
    } catch (error) {
      console.error('Error in CattleMilkService.resetRecordsByUserId:', error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
