import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';
import pool from '@/config/database';

@Injectable()
export class TasksService {
  async createTask(dto: CreateTaskDto) {
    const query = `
      INSERT INTO tasks (
        user_id, project, task, status, description, priority, deadline
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      dto.user_id,
      dto.project,
      dto.task,
      dto.status,
      dto.description || null,
      dto.priority,
      dto.deadline || null,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async getTasksByUser(
    userId: number,
    project?: string,
    deadlineDate?: string,
  ) {
    let query = 'SELECT * FROM tasks WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (project) {
      query += ` AND project = $${paramIndex++}`;
      params.push(project);
    }

    if (deadlineDate) {
      query += ` AND (deadline AT TIME ZONE 'UTC')::date = $${paramIndex++}`;
      params.push(deadlineDate);
    }

    query += ' ORDER BY deadline ASC NULLS LAST, created_on DESC';
    try {
      const { rows } = await pool.query(query, params);
      return rows;
    } catch (error) {
      console.error('Error fetching tasks by user:', error);
      throw new InternalServerErrorException('Failed to fetch tasks');
    }
  }

  async updateTask(taskId: number, dto: UpdateTaskDto) {
    if (dto.priority && !['Low', 'Medium', 'High'].includes(dto.priority)) {
      throw new BadRequestException('Invalid priority value');
    }

    const fields: string[] = [];
    const values: (string | number | Date | null | undefined)[] = [];

    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${fields.length + 2}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const query = `
    UPDATE tasks SET ${fields.join(', ')}
    WHERE task_id = $1
    RETURNING *;
  `;

    try {
      const { rows } = await pool.query(query, [taskId, ...values]);
      if (!rows.length) {
        throw new NotFoundException(`Task with ID ${taskId} not found`);
      }
      return rows[0];
    } catch (error) {
      console.error('Database error:', error);
      throw new InternalServerErrorException('Failed to update task');
    }
  }

  async deleteTask(taskId: number) {
    const query = `DELETE FROM tasks WHERE task_id = $1 RETURNING *;`;
    const { rows } = await pool.query(query, [taskId]);
    if (!rows.length) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }
    return rows[0];
  }

  async resetTable(userId: number): Promise<{ message: string }> {
    try {
      await pool.query('TRUNCATE tasks RESTART IDENTITY CASCADE');
      return { message: `Tasks table reset for user ${userId}` };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getTasksDueSoon(userId: number, days: number) {
    const targetDate = new Date();
    targetDate.setUTCDate(targetDate.getUTCDate() + days); // Work with UTC dates
    const targetDateString = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD in UTC

    const query = `
    SELECT * FROM tasks
    WHERE user_id = $1
    AND (deadline AT TIME ZONE 'UTC')::date = $2 
  `;
    const params = [userId, targetDateString];

    try {
      const { rows } = await pool.query(query, params);
      return rows;
    } catch (error) {
      console.error('Database error:', error);
      throw new InternalServerErrorException('Failed to fetch upcoming tasks');
    }
  }
}
