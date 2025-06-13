import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import pool from '@/config/database';
import { CreateExpenseDto, UpdateExpenseDto } from './expenses.dto';

@Injectable()
export class ExpensesService {
  async findByUserId(userId: number): Promise<any[]> {
    try {
      const result = await pool.query(
        'SELECT expense_id, user_id, title, occupation, category, expense, date_created, created_at FROM expenses WHERE user_id = $1 ORDER BY date_created DESC, created_at DESC, expense_id DESC',
        [userId],
      );
      return result.rows;
    } catch (error) {
      console.error('Error in ExpensesService.findByUserId:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findById(expenseId: number): Promise<any> {
    try {
      const result = await pool.query(
        'SELECT expense_id, user_id, title, occupation, category, expense, date_created, created_at FROM expenses WHERE expense_id = $1',
        [expenseId],
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in ExpensesService.findById:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async create(createDto: CreateExpenseDto): Promise<any> {
    const { user_id, title, occupation, category, expense, date_created } =
      createDto;

    try {
      const result = await pool.query(
        `INSERT INTO expenses (user_id, title, occupation, category, expense, date_created)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING expense_id, user_id, title, occupation, category, expense, date_created, created_at`,
        [user_id, title, occupation, category, expense, date_created],
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in ExpensesService.create:', error);
      if (error.code === '23503') {
        throw new BadRequestException('Invalid user_id provided.');
      }
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateDto: UpdateExpenseDto): Promise<any> {
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    const currentExpense = await this.findById(id);
    if (!currentExpense) {
      throw new NotFoundException(`Expense with ID ${id} not found.`);
    }

    Object.keys(updateDto).forEach((key) => {
      if (updateDto[key] !== undefined) {
        fieldsToUpdate.push(`${key} = $${valueIndex++}`);
        values.push(updateDto[key]);
      }
    });

    if (fieldsToUpdate.length === 0) {
      return currentExpense;
    }

    let query = 'UPDATE expenses SET ';
    query += fieldsToUpdate.join(', ');
    query += ` WHERE expense_id = $${valueIndex} RETURNING expense_id, user_id, title, occupation, category, expense, date_created, created_at`;
    values.push(id);

    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        throw new NotFoundException(
          `Expense with ID ${id} not found after update attempt.`,
        );
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in ExpensesService.update:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM expenses WHERE expense_id = $1',
        [id],
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in ExpensesService.delete:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async resetTable(userId: number): Promise<{ message: string }> {
    try {
      await pool.query('TRUNCATE expenses RESTART IDENTITY CASCADE');
      return {
        message: `Expenses table reset initiated by user ${userId}`,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to reset contracts table');
    }
  }

  async deleteByOccupationAndUser(
    userId: number,
    occupation: string,
  ): Promise<{ message: string; deletedCount: number }> {
    try {
      const result = await pool.query(
        'DELETE FROM expenses WHERE user_id = $1 AND occupation = $2',
        [userId, occupation],
      );
      return {
        message: `Expenses for user ${userId} with occupation '${occupation}' deleted.`,
        deletedCount: result.rowCount,
      };
    } catch (error) {
      console.error(
        'Error in ExpensesService.deleteByOccupationAndUser:',
        error,
      );
      throw new InternalServerErrorException(error.message);
    }
  }
}
