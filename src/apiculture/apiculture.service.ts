import { Injectable, InternalServerErrorException } from '@nestjs/common';
import pool from '@/config/database';
import { CreateApiaryDto, UpdateApiaryDto } from './apiculture.dto';

@Injectable()
export class ApicultureService {
  async findByUserId(userId: number): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT
          a.apiary_id, a.user_id, a.apiary_name, a.area, a.created_at,
          a.address_line_1, a.address_line_2, a.city, a.state, a.postal_code,
          COUNT(b.hive_id)::int as number_of_hives
         FROM apiculture a
         LEFT JOIN bee_hives b ON a.apiary_id = b.apiary_id
         WHERE a.user_id = $1
         GROUP BY a.apiary_id
         ORDER BY a.created_at DESC, a.apiary_id DESC`,
        [userId],
      );
      return result.rows;
    } catch (error) {
      console.error('Error in ApicultureService.findByUserId:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findById(apiaryId: number): Promise<any> {
    try {
      const result = await pool.query(
        `SELECT
          a.apiary_id, a.user_id, a.apiary_name, a.area, a.created_at,
          a.address_line_1, a.address_line_2, a.city, a.state, a.postal_code,
          COUNT(b.hive_id)::int as number_of_hives
         FROM apiculture a
         LEFT JOIN bee_hives b ON a.apiary_id = b.apiary_id
         WHERE a.apiary_id = $1
         GROUP BY a.apiary_id`,
        [apiaryId],
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error in ApicultureService.findById:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async create(createDto: CreateApiaryDto): Promise<any> {
    const {
      user_id,
      apiary_name,
      area,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
    } = createDto;
    try {
      const result = await pool.query(
        `INSERT INTO apiculture (user_id, apiary_name, area, address_line_1, address_line_2, city, state, postal_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING apiary_id, user_id, apiary_name, area, created_at, address_line_1, address_line_2, city, state, postal_code`,
        [
          user_id,
          apiary_name,
          area,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
        ],
      );
      return { ...result.rows[0], number_of_hives: 0 };
    } catch (error) {
      console.error('Error in ApicultureService.create:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateDto: UpdateApiaryDto): Promise<any> {
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];
    let query = 'UPDATE apiculture SET ';

    const fields = [
      'apiary_name',
      'area',
      'address_line_1',
      'address_line_2',
      'city',
      'state',
      'postal_code',
    ];

    fields.forEach((field) => {
      if (updateDto[field] !== undefined) {
        fieldsToUpdate.push(`${field} = $${fieldsToUpdate.length + 1}`);
        values.push(updateDto[field]);
      }
    });

    if (fieldsToUpdate.length === 0) {
      return this.findById(id);
    }

    query += fieldsToUpdate.join(', ');
    query += ` WHERE apiary_id = $${
      fieldsToUpdate.length + 1
    } RETURNING apiary_id, user_id, apiary_name, area, created_at, address_line_1, address_line_2, city, state, postal_code`;
    values.push(id);

    try {
      const result = await pool.query(query, values);
      if (result.rows.length > 0) {
        const updatedApiary = result.rows[0];
        const hiveCountResult = await pool.query(
          'SELECT COUNT(*)::int as number_of_hives FROM bee_hives WHERE apiary_id = $1',
          [id],
        );
        return { ...updatedApiary, ...hiveCountResult.rows[0] };
      }
      return null;
    } catch (error) {
      console.error('Error in ApicultureService.update:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM apiculture WHERE apiary_id = $1',
        [id],
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in ApicultureService.delete:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async resetForUser(userId: number): Promise<{ message: string }> {
    try {
      await pool.query('DELETE FROM apiculture WHERE user_id = $1', [userId]);
      return { message: `Apiculture data reset for user ${userId}` };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async resetTable(): Promise<{ message: string }> {
    try {
      await pool.query('TRUNCATE apiculture RESTART IDENTITY CASCADE');
      return { message: 'Apiculture table has been completely reset.' };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
