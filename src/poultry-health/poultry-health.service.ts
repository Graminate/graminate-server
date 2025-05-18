import { Injectable, InternalServerErrorException } from '@nestjs/common';
import pool from '@/config/database';

@Injectable()
export class PoultryHealthService {
  async getHealthRecords(userId: string): Promise<any[]> {
    try {
      const res = await pool.query(
        `SELECT 
          poultry_health_id, 
          date, 
          veterinary_name, 
          birds_in, 
          birds_died, 
          vaccines, 
          symptoms, 
          medications, 
          actions_taken, 
          remarks, 
          created_at, 
          mortality_rate, 
          user_id, 
          flock_id 
         FROM poultry_health WHERE user_id = $1 ORDER BY created_at DESC`, // Explicitly listed columns excluding 'type'
        [Number(userId)],
      );
      return res.rows;
    } catch (error) {
      throw new InternalServerErrorException('Error fetching health records');
    }
  }

  async addHealthRecord(record: any): Promise<any> {
    const {
      user_id,
      flock_id,
      date,
      veterinary_name,
      birds_in,
      birds_died,
      mortality_rate,
      vaccines,
      symptoms,
      medications,
      actions_taken,
      remarks,
    } = record;

    try {
      const res = await pool.query(
        `INSERT INTO poultry_health (
          user_id, flock_id, date, veterinary_name,
          birds_in, birds_died, mortality_rate, vaccines,
          symptoms, medications, actions_taken, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          user_id,
          flock_id,
          date,
          veterinary_name,
          birds_in,
          birds_died,
          mortality_rate,
          vaccines,
          symptoms,
          medications,
          actions_taken,
          remarks,
        ],
      );
      return res.rows[0];
    } catch (error) {
      console.error('Error adding health record:', error.message, error.stack);
      throw new InternalServerErrorException('Error adding health record');
    }
  }

  async deleteHealthRecord(id: number): Promise<void> {
    try {
      await pool.query(
        `DELETE FROM poultry_health WHERE poultry_health_id = $1`,
        [id],
      );
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete record');
    }
  }

  async updateHealthRecord(id: number, record: any): Promise<any> {
    const {
      date,
      veterinary_name,
      birds_in,
      birds_died,
      vaccines,
      symptoms,
      medications,
      actions_taken,
      remarks,
    } = record;

    let mortalityRateToUpdate: number | null = null;
    if (
      typeof birds_in === 'number' &&
      typeof birds_died === 'number' &&
      birds_in > 0
    ) {
      mortalityRateToUpdate = (birds_died / birds_in) * 100;
    } else if (record.mortality_rate !== undefined) {
      mortalityRateToUpdate = record.mortality_rate;
    }

    try {
      const res = await pool.query(
        `UPDATE poultry_health SET 
          date = COALESCE($1, date),
          veterinary_name = COALESCE($2, veterinary_name),
          birds_in = COALESCE($3, birds_in),
          birds_died = COALESCE($4, birds_died),
          vaccines = COALESCE($5, vaccines),
          symptoms = COALESCE($6, symptoms),
          medications = COALESCE($7, medications),
          actions_taken = COALESCE($8, actions_taken),
          remarks = COALESCE($9, remarks),
          mortality_rate = COALESCE($10, mortality_rate)
        WHERE poultry_health_id = $11
        RETURNING *`,
        [
          date,
          veterinary_name,
          birds_in,
          birds_died,
          vaccines,
          symptoms,
          medications,
          actions_taken,
          remarks,
          mortalityRateToUpdate,
          id,
        ],
      );
      if (res.rows.length === 0) {
        throw new InternalServerErrorException(
          'Health record not found or could not be updated',
        );
      }
      return res.rows[0];
    } catch (error) {
      console.error(
        'Error updating health record:',
        error.message,
        error.stack,
      );
      throw new InternalServerErrorException('Error updating health record');
    }
  }

  async resetHealthRecords(): Promise<void> {
    try {
      await pool.query(`TRUNCATE poultry_health RESTART IDENTITY CASCADE`);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to reset poultry health records',
      );
    }
  }
}
