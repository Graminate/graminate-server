import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import pool from '@/config/database';
import { CreateSaleDto, UpdateSaleDto } from './sales.dto';

@Injectable()
export class SalesService {
  async findByUserId(userId: number): Promise<any[]> {
    try {
      const result = await pool.query(
        'SELECT sales_id, user_id, sales_name, sales_date, occupation, items_sold, quantities_sold, quantity_unit, invoice_created, created_at FROM sales WHERE user_id = $1 ORDER BY sales_date DESC, created_at DESC, sales_id DESC', // Added sales_name
        [userId],
      );
      return result.rows;
    } catch (error) {
      console.error('Error in SalesService.findByUserId:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findById(saleId: number): Promise<any> {
    try {
      const result = await pool.query(
        'SELECT sales_id, user_id, sales_name, sales_date, occupation, items_sold, quantities_sold, quantity_unit, invoice_created, created_at FROM sales WHERE sales_id = $1', // Added sales_name
        [saleId],
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in SalesService.findById:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async create(createDto: CreateSaleDto): Promise<any> {
    const {
      user_id,
      sales_name,
      sales_date,
      occupation,
      items_sold,
      quantities_sold,
      quantity_unit,
      invoice_created = false,
    } = createDto;

    if (items_sold.length !== quantities_sold.length) {
      throw new BadRequestException(
        'Items sold and quantities sold arrays must have the same length.',
      );
    }

    try {
      const result = await pool.query(
        `INSERT INTO sales (user_id, sales_name, sales_date, occupation, items_sold, quantities_sold, quantity_unit, invoice_created)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING sales_id, user_id, sales_name, sales_date, occupation, items_sold, quantities_sold, quantity_unit, invoice_created, created_at`, // Added sales_name
        [
          user_id,
          sales_name, // Added sales_name
          sales_date,
          occupation,
          items_sold,
          quantities_sold,
          quantity_unit,
          invoice_created,
        ],
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in SalesService.create:', error);
      if (error.constraint === 'chk_items_quantities_length') {
        throw new BadRequestException(
          'Items sold and quantities sold arrays must have the same length (database constraint).',
        );
      }
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateDto: UpdateSaleDto): Promise<any> {
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    const currentSale = await this.findById(id);
    if (!currentSale) {
      throw new NotFoundException(`Sale with ID ${id} not found.`);
    }

    let finalItemsSold = currentSale.items_sold;
    let finalQuantitiesSold = currentSale.quantities_sold;

    if (updateDto.sales_name !== undefined) {
      fieldsToUpdate.push(`sales_name = $${valueIndex++}`);
      values.push(updateDto.sales_name);
    }
    if (updateDto.sales_date !== undefined) {
      fieldsToUpdate.push(`sales_date = $${valueIndex++}`);
      values.push(updateDto.sales_date);
    }
    if (updateDto.occupation !== undefined) {
      fieldsToUpdate.push(`occupation = $${valueIndex++}`);
      values.push(updateDto.occupation);
    }
    if (updateDto.items_sold !== undefined) {
      fieldsToUpdate.push(`items_sold = $${valueIndex++}`);
      values.push(updateDto.items_sold);
      finalItemsSold = updateDto.items_sold;
    }
    if (updateDto.quantities_sold !== undefined) {
      fieldsToUpdate.push(`quantities_sold = $${valueIndex++}`);
      values.push(updateDto.quantities_sold);
      finalQuantitiesSold = updateDto.quantities_sold;
    }
    if (updateDto.quantity_unit !== undefined) {
      fieldsToUpdate.push(`quantity_unit = $${valueIndex++}`);
      values.push(updateDto.quantity_unit);
    }
    if (updateDto.invoice_created !== undefined) {
      fieldsToUpdate.push(`invoice_created = $${valueIndex++}`);
      values.push(updateDto.invoice_created);
    }

    if (finalItemsSold.length !== finalQuantitiesSold.length) {
      throw new BadRequestException(
        'After update, items sold and quantities sold arrays must have the same length.',
      );
    }

    if (fieldsToUpdate.length === 0) {
      return currentSale;
    }

    let query = 'UPDATE sales SET ';
    query += fieldsToUpdate.join(', ');
    query += ` WHERE sales_id = $${valueIndex} RETURNING sales_id, user_id, sales_name, sales_date, occupation, items_sold, quantities_sold, quantity_unit, invoice_created, created_at`; // Added sales_name
    values.push(id);

    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        throw new NotFoundException(
          `Sale with ID ${id} not found after update attempt.`,
        );
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in SalesService.update:', error);
      if (error.constraint === 'chk_items_quantities_length') {
        throw new BadRequestException(
          'Items sold and quantities sold arrays must have the same length (database constraint).',
        );
      }
      throw new InternalServerErrorException(error.message);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await pool.query('DELETE FROM sales WHERE sales_id = $1', [
        id,
      ]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in SalesService.delete:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async resetTable(userId: number): Promise<{ message: string }> {
    try {
      await pool.query('TRUNCATE sales RESTART IDENTITY CASCADE');
      return { message: `Sales table reset for user ${userId}` };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
