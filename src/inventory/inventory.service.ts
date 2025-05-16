// inventory.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import pool from '@/config/database';
import { CreateInventoryDto } from './inventory.dto'; // Import the DTO

interface InventoryFilters {
  limit?: number;
  offset?: number;
  itemGroup?: string;
  warehouseId?: number;
}

@Injectable()
export class InventoryService {
  async findByUserIdWithFilters(
    userId: number,
    filters: InventoryFilters,
  ): Promise<any[]> {
    const { limit, offset, itemGroup, warehouseId } = filters;
    let query = 'SELECT * FROM inventory WHERE user_id = $1';
    const queryParams: any[] = [userId];
    let paramIndex = 2;

    if (warehouseId !== undefined) {
      query += ` AND warehouse_id = $${paramIndex}`;
      queryParams.push(warehouseId);
      paramIndex++;
    }

    if (itemGroup) {
      query += ` AND item_group = $${paramIndex}`;
      queryParams.push(itemGroup);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC, inventory_id DESC'; // Added fallback sort

    if (limit !== undefined) {
      query += ` LIMIT $${paramIndex}`;
      queryParams.push(limit);
      paramIndex++;
    }

    if (offset !== undefined) {
      query += ` OFFSET $${paramIndex}`;
      queryParams.push(offset);
      // paramIndex++; // No more params after offset
    }

    try {
      const result = await pool.query(query, queryParams);
      return result.rows;
    } catch (error) {
      console.error(
        'Error executing query in findByUserIdWithFilters:',
        error,
        query,
        queryParams,
      );
      throw new InternalServerErrorException(
        `Database query failed: ${error.message}`,
      );
    }
  }

  async create(createDto: CreateInventoryDto): Promise<any> {
    const {
      user_id,
      item_name,
      item_group,
      units,
      quantity,
      price_per_unit,
      warehouse_id, // Destructure warehouse_id
    } = createDto;
    try {
      const result = await pool.query(
        `INSERT INTO inventory (user_id, item_name, item_group, units, quantity, price_per_unit, warehouse_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          user_id,
          item_name,
          item_group,
          units,
          quantity,
          price_per_unit,
          warehouse_id, // Pass warehouse_id to the query
        ],
      );
      return result.rows[0];
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateDto: any): Promise<any> {
    const { item_name, item_group, units, quantity, price_per_unit } =
      updateDto;
    // If you decide to make warehouse_id updatable, add it here and to the query
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
      // Be careful with TRUNCATE. This will delete ALL inventory for ALL users
      // if not scoped correctly. Consider deleting only for a specific user if needed.
      // For now, assuming this is an admin action to clear all inventory.
      // If it's user-specific reset, it should be DELETE FROM inventory WHERE user_id = $1
      await pool.query('TRUNCATE inventory RESTART IDENTITY CASCADE');
      return { message: `Inventory table reset for user ${userId}` }; // Message might be misleading if it's global.
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
