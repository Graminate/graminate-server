import { Injectable, InternalServerErrorException } from '@nestjs/common';
import pool from '@/config/database';

@Injectable()
export class LabourService {
  async getLabours(userId: string) {
    if (!userId || isNaN(Number(userId))) {
      return {
        status: 400,
        data: { error: 'Invalid or missing id parameter' },
      };
    }

    try {
      const query = `SELECT * FROM labours WHERE user_id = $1 ORDER BY created_at DESC;`;
      const result = await pool.query(query, [Number(userId)]);

      if (result.rows.length === 0) {
        return {
          status: 404,
          data: { error: 'No labour records found for this user' },
        };
      }

      return { status: 200, data: { labours: result.rows } };
    } catch (error) {
      console.error('Error fetching labour:', error);
      return { status: 500, data: { error: 'Internal Server Error' } };
    }
  }

  async addLabour(body: any) {
    const {
      user_id,
      full_name,
      date_of_birth,
      gender,
      guardian_name,
      address,
      contact_number,
      aadhar_card_number,
    } = body;

    if (
      !user_id ||
      !full_name ||
      !date_of_birth ||
      !gender ||
      !guardian_name ||
      !address ||
      !contact_number ||
      !aadhar_card_number
    ) {
      return { status: 400, data: { error: 'Missing required fields' } };
    }

    try {
      const query = `
        INSERT INTO labours (user_id, full_name, date_of_birth, gender, guardian_name, address, contact_number, aadhar_card_number, role) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Worker') 
        RETURNING *;
      `;

      const values = [
        user_id,
        full_name,
        date_of_birth,
        gender,
        guardian_name,
        address,
        contact_number,
        aadhar_card_number,
      ];

      const { rows } = await pool.query(query, values);

      return {
        status: 201,
        data: { message: 'Labour added successfully', labour: rows[0] },
      };
    } catch (error) {
      console.error('Error inserting labour:', error);
      return { status: 500, data: { error: 'Internal Server Error' } };
    }
  }

  async deleteLabour(id: string) {
    if (!id) {
      return { status: 400, data: { error: 'Missing labour_id' } };
    }

    try {
      const result = await pool.query(
        `DELETE FROM labours WHERE labour_id = $1 RETURNING *;`,
        [id],
      );

      if (result.rowCount === 0) {
        return { status: 404, data: { error: 'Labour not found' } };
      }

      return {
        status: 200,
        data: {
          message: 'Labour deleted successfully',
          deletedLabour: result.rows[0],
        },
      };
    } catch (error) {
      console.error('Error deleting labour:', error);
      return { status: 500, data: { error: 'Internal Server Error' } };
    }
  }

  async updateLabour(body: any) {
    const { labour_id } = body;

    if (!labour_id) {
      return { status: 400, data: { error: 'Missing labour_id' } };
    }

    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let index = 1;

      const push = (field: string, val: any) => {
        updateFields.push(`${field} = $${index++}`);
        values.push(val);
      };

      if (body.full_name) push('full_name', body.full_name);
      if (body.guardian_name) push('guardian_name', body.guardian_name);
      if (body.date_of_birth) {
        const formatted = body.date_of_birth.split('/').reverse().join('-');
        push('date_of_birth', formatted);
      }
      if (body.gender) push('gender', body.gender);
      if (body.role) push('role', body.role);
      if (body.contact_number) push('contact_number', body.contact_number);
      if (body.aadhar_card_number)
        push('aadhar_card_number', body.aadhar_card_number);
      if (body.address) push('address', body.address);
      if (body.voter_id) push('voter_id', body.voter_id);
      if (body.ration_card) push('ration_card', body.ration_card);
      if (body.pan_card) push('pan_card', body.pan_card);
      if (body.driving_license) push('driving_license', body.driving_license);
      if (body.mnrega_job_card_number)
        push('mnrega_job_card_number', body.mnrega_job_card_number);
      if (body.bank_account_number)
        push('bank_account_number', body.bank_account_number);
      if (body.ifsc_code) push('ifsc_code', body.ifsc_code);
      if (body.bank_name) push('bank_name', body.bank_name);
      if (body.bank_branch) push('bank_branch', body.bank_branch);
      if (body.disability_status !== undefined)
        push('disability_status', body.disability_status);
      if (body.epfo) push('epfo', body.epfo);
      if (body.esic) push('esic', body.esic);
      if (body.pm_kisan !== undefined) push('pm_kisan', body.pm_kisan);

      if (updateFields.length === 0) {
        return { status: 400, data: { error: 'No fields provided to update' } };
      }

      values.push(labour_id);
      const query = `UPDATE labours SET ${updateFields.join(', ')} WHERE labour_id = $${index} RETURNING *;`;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return { status: 404, data: { error: 'Labour not found' } };
      }

      return {
        status: 200,
        data: {
          message: 'Labour updated successfully',
          updatedLabour: result.rows[0],
        },
      };
    } catch (error) {
      console.error('Error updating labour:', error);
      return { status: 500, data: { error: 'Internal Server Error' } };
    }
  }

  async resetTable(userId: number): Promise<{ message: string }> {
    try {
      await pool.query('TRUNCATE labours RESTART IDENTITY CASCADE');
      return { message: `Labours table reset for user ${userId}` };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
