import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import pool from '@/config/database';
import { CreateHiveDto, UpdateHiveDto } from './bee-hives.dto';

@Injectable()
export class BeeHivesService {
  async findByApiaryId(apiaryId: number): Promise<any[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM bee_hives WHERE apiary_id = $1 ORDER BY hive_name ASC',
        [apiaryId],
      );
      return result.rows;
    } catch (error) {
      console.error('Error in BeeHivesService.findByApiaryId:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findById(hiveId: number): Promise<any> {
    const result = await pool.query(
      'SELECT * FROM bee_hives WHERE hive_id = $1',
      [hiveId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Hive with ID ${hiveId} not found`);
    }
    return result.rows[0];
  }

  async create(createDto: CreateHiveDto): Promise<any> {
    const {
      apiary_id,
      hive_name,
      hive_type,
      installation_date,
      queen_status,
      queen_introduced_date,
      last_inspection_date,
      brood_pattern,
      honey_stores_kg,
      pest_infestation,
      disease_detected,
      swarm_risk,
      ventilation_status,
      notes,
    } = createDto;
    try {
      const result = await pool.query(
        `INSERT INTO bee_hives (apiary_id, hive_name, hive_type, installation_date, queen_status, queen_introduced_date, last_inspection_date, brood_pattern, honey_stores_kg, pest_infestation, disease_detected, swarm_risk, ventilation_status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
        [
          apiary_id,
          hive_name,
          hive_type,
          installation_date,
          queen_status,
          queen_introduced_date,
          last_inspection_date,
          brood_pattern,
          honey_stores_kg,
          pest_infestation,
          disease_detected,
          swarm_risk,
          ventilation_status,
          notes,
        ],
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in BeeHivesService.create:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateDto: UpdateHiveDto): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updateDto).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `UPDATE bee_hives SET ${fields.join(
      ', ',
    )} WHERE hive_id = $${paramIndex} RETURNING *`;

    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        throw new NotFoundException(`Hive with ID ${id} not found`);
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in BeeHivesService.update:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM bee_hives WHERE hive_id = $1',
      [id],
    );
    return result.rowCount > 0;
  }

  async resetTable(userId: number): Promise<{ message: string }> {
    try {
      await pool.query('TRUNCATE bee_hives RESTART IDENTITY CASCADE');
      return { message: `Bee Hives table reset for user ${userId}` };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
