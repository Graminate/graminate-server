import { Injectable, InternalServerErrorException } from '@nestjs/common';
import pool from '@/config/database';

@Injectable()
export class WarehouseService {
  async findByUserId(userId: number): Promise<any[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM warehouse WHERE user_id = $1',
        [userId],
      );
      return result.rows;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async create(createDto: any): Promise<any> {
    const {
      user_id,
      name,
      type,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
      contact_person,
      phone,
      storage_capacity,
    } = createDto;
    try {
      const result = await pool.query(
        `INSERT INTO warehouse (
          user_id, name, type, address_line_1, address_line_2, city, state,
          postal_code, country, contact_person, phone, storage_capacity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [
          user_id,
          name,
          type,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country,
          contact_person,
          phone,
          storage_capacity,
        ],
      );
      return result.rows[0];
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateDto: any): Promise<any> {
    const {
      name,
      type,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
      contact_person,
      phone,
      storage_capacity,
    } = updateDto;
    try {
      const result = await pool.query(
        `UPDATE warehouse SET
          name = COALESCE($1, name),
          type = COALESCE($2, type),
          address_line_1 = COALESCE($3, address_line_1),
          address_line_2 = COALESCE($4, address_line_2),
          city = COALESCE($5, city),
          state = COALESCE($6, state),
          postal_code = COALESCE($7, postal_code),
          country = COALESCE($8, country),
          contact_person = COALESCE($9, contact_person),
          phone = COALESCE($10, phone),
          storage_capacity = COALESCE($11, storage_capacity)
        WHERE warehouse_id = $12 RETURNING *`,
        [
          name,
          type,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country,
          contact_person,
          phone,
          storage_capacity,
          id,
        ],
      );
      return result.rows[0];
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM warehouse WHERE warehouse_id = $1',
        [id],
      );
      return result.rowCount > 0;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async resetTable(userId: number): Promise<{ message: string }> {
    try {
      await pool.query('TRUNCATE warehouse RESTART IDENTITY CASCADE');
      return { message: `Warehouse table reset for user ${userId}` };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
