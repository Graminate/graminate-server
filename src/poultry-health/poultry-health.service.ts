import { Injectable, InternalServerErrorException } from '@nestjs/common';
import pool from '@/config/database';

@Injectable()
export class PoultryHealthService {
  // Fetch all poultry health records for a given user
  async getHealthRecords(userId: string): Promise<any[]> {
    try {
      const res = await pool.query(
        `SELECT * FROM poultry_health WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId],
      );
      return res.rows;
    } catch (error) {
      throw new InternalServerErrorException('Error fetching health records');
    }
  }

  // Add a new poultry health record
  async addHealthRecord(record: any): Promise<any> {
    const {
      user_id,
      date,
      veterinary_name,
      bird_type,
      purpose,
      birds_in,
      birds_died,
      mortality_rate,
      vaccines,
      deworming,
      symptoms,
      medications,
      actions_taken,
      remarks,
    } = record;

    try {
      const res = await pool.query(
        `INSERT INTO poultry_health (
    user_id, date, veterinary_name, bird_type, purpose,
    birds_in, birds_died, mortality_rate, vaccines, deworming,
    symptoms, medications, actions_taken, remarks
  ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
  RETURNING *`,
        [
          user_id,
          date,
          veterinary_name,
          bird_type,
          purpose,
          birds_in,
          birds_died,
          mortality_rate,
          vaccines,
          deworming,
          symptoms,
          medications,
          actions_taken,
          remarks,
        ],
      );
      return res.rows[0];
    } catch (error) {
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
    try {
      const res = await pool.query(
        `UPDATE poultry_health SET 
          date = $1,
          veterinary_name = $2,
          bird_type = $3,
          purpose = $4,
          birds_in = $5,
          birds_died = $6,
          vaccines = $7,
          deworming = $8,
          symptoms = $9,
          medications = $10,
          actions_taken = $11,
          remarks = $12
        WHERE poultry_health_id = $13
        RETURNING *`,
        [
          record.date,
          record.veterinary_name,
          record.bird_type,
          record.purpose,
          record.birds_in,
          record.birds_died,
          record.vaccines,
          record.deworming,
          record.symptoms,
          record.medications,
          record.actions_taken,
          record.remarks,
          id,
        ],
      );
      return res.rows[0];
    } catch (error) {
      throw new InternalServerErrorException('Error updating health record');
    }
  }
}
