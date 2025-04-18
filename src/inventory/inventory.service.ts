import { Injectable, InternalServerErrorException } from '@nestjs/common';
import pool from '@/config/database';

@Injectable()
export class InventoryService {
  async findByUserId(userId: number): Promise<any[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM inventory WHERE user_id = $1',
        [userId],
      );
      return result.rows;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async create(createDto: any): Promise<any> {
    const { user_id, item_name, item_group, units, quantity, price_per_unit } =
      createDto;
    try {
      const result = await pool.query(
        `INSERT INTO inventory (user_id, item_name, item_group, units, quantity, price_per_unit) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [user_id, item_name, item_group, units, quantity, price_per_unit],
      );
      return result.rows[0];
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateDto: any): Promise<any> {
    const { item_name, item_group, units, quantity, price_per_unit } =
      updateDto;
    try {
      const result = await pool.query(
        `UPDATE inventory SET 
            item_name = COALESCE($1, item_name),
            item_group = COALESCE($2, item_group),
            units = COALESCE($3, units),
            quantity = COALESCE($4, quantity),
            price_per_unit = COALESCE($5, price_per_unit)
         WHERE inventory_id = $6 RETURNING *`,
        [item_name, item_group, units, quantity, price_per_unit, id],
      );
      return result.rows[0];
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM inventory WHERE inventory_id = $1',
        [id],
      );
      return result.rowCount > 0;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async resetTable(userId: number): Promise<{ message: string }> {
    try {
      await pool.query('TRUNCATE inventory RESTART IDENTITY CASCADE');
      return { message: `Inventory table reset for user ${userId}` };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
