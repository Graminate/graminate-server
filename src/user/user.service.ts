import { Injectable } from '@nestjs/common';
import pool from '@/config/database';
import * as argon2 from 'argon2';

@Injectable()
export class UserService {
  jwtService: any;

  async getUserById(id: string) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE user_id = $1',
        [id],
      );
      if (result.rows.length === 0) {
        return { status: 404, data: { error: 'User not found' } };
      }

      const user = result.rows[0];
      return {
        status: 200,
        data: {
          user: {
            user_id: user.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone_number: user.phone_number,
            business_name: user.business_name,
            imageUrl: user.image_url || null,
            language: user.language || 'English',
            time_format: user.time_format || '24-hour',
            type: user.type,
            sub_type: Array.isArray(user.sub_type)
              ? user.sub_type
              : typeof user.sub_type === 'string'
                ? user.sub_type.replace(/[{}"]/g, '').split(',').filter(Boolean)
                : [],
          },
        },
      };
    } catch (err) {
      console.error('Error fetching user:', err);
      return { status: 500, data: { error: 'Failed to fetch user' } };
    }
  }

  async updateUser(id: string, body: any) {
    const {
      first_name,
      last_name,
      phone_number,
      language,
      time_format,
      type,
      business_name,
      sub_type,
    } = body;

    try {
      const existing = await pool.query(
        'SELECT * FROM users WHERE user_id = $1',
        [id],
      );
      if (existing.rows.length === 0) {
        return { status: 404, data: { error: 'User not found' } };
      }

      const updateFields: string[] = [];
      const values: any[] = [];

      if (first_name !== undefined) {
        updateFields.push(`first_name = $${values.length + 1}`);
        values.push(first_name);
      }
      if (last_name !== undefined) {
        updateFields.push(`last_name = $${values.length + 1}`);
        values.push(last_name);
      }
      if (phone_number !== undefined) {
        updateFields.push(`phone_number = $${values.length + 1}`);
        values.push(phone_number);
      }
      if (language !== undefined) {
        updateFields.push(`language = $${values.length + 1}`);
        values.push(language);
      }
      if (time_format !== undefined) {
        updateFields.push(`time_format = $${values.length + 1}`);
        values.push(time_format);
      }
      if (type !== undefined) {
        updateFields.push(`type = $${values.length + 1}`);
        values.push(type);
      }
      if (business_name !== undefined) {
        updateFields.push(`business_name = $${values.length + 1}`);
        values.push(business_name);
      }

      // Add all subTypes to be added to Producer
      if (sub_type !== undefined) {
        const validSubTypes = ['Fishery', 'Poultry', 'Animal Husbandry'];
        const filteredSubTypes = Array.isArray(sub_type)
          ? sub_type.filter((t) => validSubTypes.includes(t))
          : [];

        updateFields.push(`sub_type = $${values.length + 1}`);
        values.push(filteredSubTypes); // Postgres will accept text[] directly if passed as array
      }

      if (updateFields.length === 0) {
        return { status: 400, data: { error: 'No fields to update' } };
      }

      const updateQuery = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE user_id = $${values.length + 1}
    `;

      values.push(id);

      await pool.query(updateQuery, values);

      return { status: 200, data: { message: 'User updated successfully' } };
    } catch (err) {
      console.error('Error updating user:', err);
      return { status: 500, data: { error: 'Failed to update user' } };
    }
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload = { userId: user.user_id };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number,
        business_name: user.business_name,
      },
    };
  }
  async validateUser(email: string, password: string) {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [
        email,
      ]);
      if (result.rows.length === 0) {
        throw new Error('Invalid email or password');
      }

      const user = result.rows[0];
      const isValid = await argon2.verify(user.password, password);
      if (!isValid) {
        throw new Error('Invalid email or password');
      }

      return user;
    } catch (err) {
      console.error('Error validating user:', err);
      throw new Error('Invalid email or password');
    }
  }

  async registerUser(body: any) {
    const {
      first_name,
      last_name,
      email,
      phone_number,
      business_name,
      date_of_birth,
      password,
      type,
    } = body;

    if (!first_name || !last_name || !email || !phone_number || !password) {
      return { status: 400, data: { error: 'Missing required fields' } };
    }

    try {
      const existing = await pool.query(
        'SELECT * FROM users WHERE email = $1 OR phone_number = $2',
        [email, phone_number],
      );

      if (existing.rows.length > 0) {
        return {
          status: 409,
          data: { error: 'Email or phone number already in use' },
        };
      }

      const hashedPassword = await argon2.hash(password, {
        type: argon2.argon2id,
        hashLength: 16,
        timeCost: 2,
        memoryCost: 2 ** 16,
        parallelism: 1,
      });

      const result = await pool.query(
        `INSERT INTO users (first_name, last_name, email, phone_number, business_name, date_of_birth, password, type)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
   RETURNING user_id, first_name, last_name, email, phone_number, business_name, type`,
        [
          first_name,
          last_name,
          email,
          phone_number,
          business_name,
          date_of_birth,
          hashedPassword,
          type,
        ],
      );

      return {
        status: 201,
        data: {
          message: 'User registered successfully',
          user: result.rows[0],
        },
      };
    } catch (err) {
      console.error('Error registering user:', err);
      return { status: 500, data: { error: 'Failed to register user' } };
    }
  }

  async deleteUser(id: string) {
    try {
      const existing = await pool.query(
        'SELECT 1 FROM users WHERE user_id = $1',
        [id],
      );
      if (existing.rows.length === 0) {
        return { status: 404, data: { error: 'User not found' } };
      }
      await pool.query('DELETE FROM users WHERE user_id = $1', [id]);
      return { status: 200, data: { message: 'User deleted successfully' } };
    } catch (err) {
      console.error('Error deleting user:', err);
      return { status: 500, data: { error: 'Failed to delete user' } };
    }
  }

  async getUserTypeById(id: string) {
    try {
      const result = await pool.query(
        'SELECT type FROM users WHERE user_id = $1',
        [id],
      );

      if (result.rows.length === 0) {
        return { status: 404, data: { error: 'User not found' } };
      }

      return {
        status: 200,
        data: { type: result.rows[0].type },
      };
    } catch (err) {
      console.error('Error fetching user type:', err);
      return { status: 500, data: { error: 'Failed to fetch user type' } };
    }
  }

  async verifyPassword(userId: string, password: string) {
    try {
      const result = await pool.query(
        'SELECT password FROM users WHERE user_id = $1',
        [userId],
      );
      if (result.rows.length === 0) {
        return { status: 404, data: { error: 'User not found' } };
      }

      const user = result.rows[0];
      const isValid = await argon2.verify(user.password, password);

      return {
        status: isValid ? 200 : 401,
        data: { valid: isValid },
      };
    } catch (err) {
      console.error('Error verifying password:', err);
      return { status: 500, data: { error: 'Failed to verify password' } };
    }
  }

  async findByEmail(email: string) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    return result.rows[0] || null;
  }

  async getUserCount() {
    try {
      const result = await pool.query('SELECT COUNT(*) FROM users');
      return {
        status: 200,
        data: { total_users: parseInt(result.rows[0].count, 10) },
      };
    } catch (err) {
      console.error('Error fetching user count:', err);
      return { status: 500, data: { error: 'Failed to fetch user count' } };
    }
  }

  async getAllUsersMinimal() {
    try {
      const result = await pool.query(`
      SELECT user_id, first_name, last_name, email, business_name, type
      FROM users
      ORDER BY created_at DESC
    `);

      return { status: 200, data: { users: result.rows } };
    } catch (err) {
      console.error('Error fetching all users:', err);
      return { status: 500, data: { error: 'Failed to fetch all users' } };
    }
  }
}
