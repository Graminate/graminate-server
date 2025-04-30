import {
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

  async getTasksByUser(userId: number, project?: string) {
    let query = 'SELECT * FROM tasks WHERE user_id = $1';
    const params: any[] = [userId];

    if (project) {
      query += ' AND project = $2';
      params.push(project);
    }

    query += ' ORDER BY created_on DESC';
    const { rows } = await pool.query(query, params);
    return rows;
  }

  async updateTask(taskId: number, dto: UpdateTaskDto) {
    // Dynamic update fields
    const fields = Object.entries(dto).map(
      ([key], idx) => `${key} = $${idx + 2}`,
    );
    const values = [taskId, ...Object.values(dto)];
    const query = `
      UPDATE tasks SET ${fields.join(', ')}
      WHERE task_id = $1
      RETURNING *;
    `;
    const { rows } = await pool.query(query, values);
    if (!rows.length) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }
    return rows[0];
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
}
