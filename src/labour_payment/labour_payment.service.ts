import { Injectable, InternalServerErrorException } from '@nestjs/common';
import pool from '@/config/database';

@Injectable()
export class LabourPaymentService {
  async getPayments(labourId: string) {
    if (!labourId || isNaN(Number(labourId))) {
      return {
        status: 400,
        data: { error: 'Invalid or missing labourId parameter' },
      };
    }

    try {
      const query = `SELECT * FROM labour_payments WHERE labour_id = $1 ORDER BY payment_date DESC;`;
      const result = await pool.query(query, [Number(labourId)]);

      if (result.rows.length === 0) {
        return {
          status: 404,
          data: { error: 'No payment records found for this labour' },
        };
      }

      return { status: 200, data: { payments: result.rows } };
    } catch (error) {
      console.error('Error fetching payments:', error);
      return { status: 500, data: { error: 'Internal Server Error' } };
    }
  }

  async addPayment(body: any) {
    const {
      labour_id,
      payment_date,
      salary_paid,
      bonus,
      overtime_pay,
      housing_allowance,
      travel_allowance,
      meal_allowance,
      payment_status,
    } = body;

    if (
      !labour_id ||
      !payment_date ||
      salary_paid === undefined ||
      bonus === undefined ||
      overtime_pay === undefined ||
      housing_allowance === undefined ||
      travel_allowance === undefined ||
      meal_allowance === undefined
    ) {
      return { status: 400, data: { error: 'Missing required fields' } };
    }

    try {
      const total_amount =
        Number(salary_paid) +
        Number(bonus) +
        Number(overtime_pay) +
        Number(housing_allowance) +
        Number(travel_allowance) +
        Number(meal_allowance);
      const query = `
        INSERT INTO labour_payments (
          labour_id, payment_date, salary_paid, bonus, overtime_pay, housing_allowance, travel_allowance, meal_allowance, total_amount, payment_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `;
      const values = [
        labour_id,
        payment_date,
        salary_paid,
        bonus,
        overtime_pay,
        housing_allowance,
        travel_allowance,
        meal_allowance,
        total_amount,
        payment_status || 'Pending',
      ];
      const { rows } = await pool.query(query, values);

      return {
        status: 201,
        data: { message: 'Payment added successfully', payment: rows[0] },
      };
    } catch (error) {
      console.error('Error inserting payment:', error);
      return { status: 500, data: { error: 'Internal Server Error' } };
    }
  }

  async updatePayment(body: any) {
    const { payment_id } = body;
    if (!payment_id) {
      return { status: 400, data: { error: 'Missing payment_id' } };
    }

    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let index = 1;

      const push = (field: string, val: any) => {
        updateFields.push(`${field} = $${index++}`);
        values.push(val);
      };

      if (body.payment_date) push('payment_date', body.payment_date);
      if (body.salary_paid !== undefined) push('salary_paid', body.salary_paid);
      if (body.bonus !== undefined) push('bonus', body.bonus);
      if (body.overtime_pay !== undefined)
        push('overtime_pay', body.overtime_pay);
      if (body.housing_allowance !== undefined)
        push('housing_allowance', body.housing_allowance);
      if (body.travel_allowance !== undefined)
        push('travel_allowance', body.travel_allowance);
      if (body.meal_allowance !== undefined)
        push('meal_allowance', body.meal_allowance);
      if (body.payment_status) push('payment_status', body.payment_status);

      if (updateFields.length === 0) {
        return { status: 400, data: { error: 'No fields provided to update' } };
      }

      const existing = await pool.query(
        'SELECT * FROM labour_payments WHERE payment_id = $1',
        [payment_id],
      );
      if (existing.rows.length === 0) {
        return { status: 404, data: { error: 'Payment record not found' } };
      }
      const currentPayment = existing.rows[0];
      const newBaseSalary =
        body.salary_paid !== undefined
          ? body.salary_paid
          : currentPayment.salary_paid;
      const newBonus =
        body.bonus !== undefined ? body.bonus : currentPayment.bonus;
      const newOvertime =
        body.overtime_pay !== undefined
          ? body.overtime_pay
          : currentPayment.overtime_pay;
      const newHousing =
        body.housing_allowance !== undefined
          ? body.housing_allowance
          : currentPayment.housing_allowance;
      const newTravel =
        body.travel_allowance !== undefined
          ? body.travel_allowance
          : currentPayment.travel_allowance;
      const newMeal =
        body.meal_allowance !== undefined
          ? body.meal_allowance
          : currentPayment.meal_allowance;
      const total_amount =
        Number(newBaseSalary) +
        Number(newBonus) +
        Number(newOvertime) +
        Number(newHousing) +
        Number(newTravel) +
        Number(newMeal);

      push('total_amount', total_amount);

      values.push(payment_id);
      const query = `UPDATE labour_payments SET ${updateFields.join(
        ', ',
      )} WHERE payment_id = $${index} RETURNING *;`;
      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return { status: 404, data: { error: 'Payment record not found' } };
      }
      return {
        status: 200,
        data: {
          message: 'Payment updated successfully',
          payment: result.rows[0],
        },
      };
    } catch (error) {
      console.error('Error updating payment:', error);
      return { status: 500, data: { error: 'Internal Server Error' } };
    }
  }
}
