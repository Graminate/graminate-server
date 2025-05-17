import { Injectable } from '@nestjs/common';
import pool from '@/config/database';
import * as argon2 from 'argon2';

@Injectable()
export class UserService {
  getAllUsersMinimal() {
    throw new Error('Method not implemented.');
  }
  getUserCount() {
    throw new Error('Method not implemented.');
  }
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
            language: user.language || 'English',
            time_format: user.time_format || '24-hour',
            temperature_scale: user.temperature_scale || 'Celsius',
            type: user.type,
            sub_type: Array.isArray(user.sub_type)
              ? user.sub_type
              : typeof user.sub_type === 'string'
                ? user.sub_type.replace(/[{}"]/g, '').split(',').filter(Boolean)
                : [],
            address_line_1: user.address_line_1 || '',
            address_line_2: user.address_line_2 || '',
            city: user.city || '',
            state: user.state || '',
            postal_code: user.postal_code || '',
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
      temperature_scale,
      type,
      business_name,
      sub_type,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
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
      if (temperature_scale !== undefined) {
        updateFields.push(`temperature_scale = $${values.length + 1}`);
        values.push(temperature_scale);
      }
      if (type !== undefined) {
        updateFields.push(`type = $${values.length + 1}`);
        values.push(type);
      }
      if (business_name !== undefined) {
        updateFields.push(`business_name = $${values.length + 1}`);
        values.push(business_name);
      }
      if (address_line_1 !== undefined) {
        updateFields.push(`address_line_1 = $${values.length + 1}`);
        values.push(address_line_1);
      }
      if (address_line_2 !== undefined) {
        updateFields.push(`address_line_2 = $${values.length + 1}`);
        values.push(address_line_2);
      }
      if (city !== undefined) {
        updateFields.push(`city = $${values.length + 1}`);
        values.push(city);
      }
      if (state !== undefined) {
        updateFields.push(`state = $${values.length + 1}`);
        values.push(state);
      }
      if (postal_code !== undefined) {
        updateFields.push(`postal_code = $${values.length + 1}`);
        values.push(postal_code);
      }

      if (sub_type !== undefined) {
        const validSubTypes = ['Fishery', 'Poultry', 'Animal Husbandry'];
        const filteredSubTypes = Array.isArray(sub_type)
          ? sub_type.filter((t) => validSubTypes.includes(t))
          : [];

        updateFields.push(`sub_type = $${values.length + 1}`);
        values.push(filteredSubTypes);
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
        language: user.language || 'English',
        time_format: user.time_format || '24-hour',
        temperature_scale: user.temperature_scale || 'Celsius',
        address_line_1: user.address_line_1 || '',
        address_line_2: user.address_line_2 || '',
        city: user.city || '',
        state: user.state || '',
        postal_code: user.postal_code || '',
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
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
    } = body;

    if (!first_name || !last_name || !email || !phone_number || !password) {
      console.log('Missing required fields:', {
        first_name,
        last_name,
        email,
        phone_number,
        password,
      });
      return { status: 400, data: { error: 'Missing required fields' } };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check for existing user
      const existing = await client.query(
        'SELECT 1 FROM users WHERE email = $1 OR phone_number = $2 FOR UPDATE',
        [email, phone_number],
      );

      if (existing.rows.length > 0) {
        console.log(
          'User already exists with email/phone:',
          email,
          phone_number,
        );
        await client.query('ROLLBACK');
        return {
          status: 409,
          data: { error: 'Email or phone number already in use' },
        };
      }

      // Hash password
      const hashedPassword = await argon2.hash(password, {
        type: argon2.argon2id,
        hashLength: 16,
        timeCost: 2,
        memoryCost: 2 ** 16,
        parallelism: 1,
      });

      // Insert new user
      const result = await client.query(
        `INSERT INTO users (
          first_name, last_name, email, phone_number, 
          business_name, date_of_birth, password, type,
          address_line_1, address_line_2, city, state, postal_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING user_id, first_name, last_name, email, phone_number, business_name`,
        [
          first_name,
          last_name,
          email,
          phone_number,
          business_name || null,
          date_of_birth || null,
          hashedPassword,
          type || null,
          address_line_1 || null,
          address_line_2 || null,
          city || null,
          state || null,
          postal_code || null,
        ],
      );

      await client.query('COMMIT');
      console.log('Successfully registered user:', result.rows[0]);
      return {
        status: 201,
        data: {
          message: 'User registered successfully',
          user: result.rows[0],
        },
      };
    } catch (err) {
      await client.query('ROLLBACK').catch((rollbackErr) => {
        console.error('Error rolling back transaction:', rollbackErr);
      });
      console.error('Error registering user:', err);
      return { status: 500, data: { error: 'Failed to register user' } };
    } finally {
      client.release();
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
}
