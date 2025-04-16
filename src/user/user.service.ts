import { Injectable } from '@nestjs/common';
import pool from '@/config/database';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';
import { serialize } from 'cookie';

@Injectable()
export class UserService {
  async validateSession(
    sessionId: string,
    requestedUserId: string,
  ): Promise<boolean> {
    if (!sessionId || !requestedUserId) return false;

    const session = await pool.query('SELECT * FROM session WHERE sid = $1', [
      sessionId,
    ]);
    if (session.rows.length === 0) return false;

    const sess = session.rows[0];
    const expireDate = new Date(sess.expire);
    if (expireDate < new Date()) {
      // Optional: delete expired session
      await pool.query('DELETE FROM session WHERE sid = $1', [sessionId]);
      return false;
    }

    const sessionData =
      typeof sess.sess === 'string' ? JSON.parse(sess.sess) : sess.sess;

    return String(sessionData.userId) === String(requestedUserId);
  }

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

  async loginUser(body: any, res: Response) {
    const { email, password } = body;

    if (!email || !password) {
      return {
        status: 400,
        data: { error: 'Email and password are required.' },
      };
    }

    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [
        email,
      ]);

      if (result.rows.length === 0) {
        return { status: 401, data: { error: 'User does not exist' } };
      }

      const user = result.rows[0];
      const isValid = await argon2.verify(user.password, password);
      if (!isValid) {
        return { status: 401, data: { error: 'Invalid email or password.' } };
      }

      const sessionId = uuidv4();
      const sessionData = {
        userId: user.user_id,
        createdAt: new Date().toISOString(),
      };
      const expire = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days

      await pool.query(
        'INSERT INTO session (sid, sess, expire) VALUES ($1, $2, $3)',
        [sessionId, JSON.stringify(sessionData), expire],
      );

      res.setHeader(
        'Set-Cookie',
        serialize('sid', sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 3 * 24 * 60 * 60,
          path: '/',
        }),
      );

      return {
        status: 200,
        data: {
          message: 'Login successful',
          user: {
            user_id: user.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone_number: user.phone_number,
            business_name: user.business_name,
          },
        },
      };
    } catch (err) {
      console.error('Error during login:', err);
      return {
        status: 500,
        data: { error: 'An internal server error occurred.' },
      };
    }
  }

  async logoutUser(sessionId: string, res: Response) {
    if (!sessionId) {
      return { status: 400, data: { error: 'No active session found.' } };
    }

    try {
      await pool.query('DELETE FROM session WHERE sid = $1', [sessionId]);

      res.setHeader(
        'Set-Cookie',
        serialize('sid', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 0,
          path: '/',
        }),
      );

      return { status: 200, data: { message: 'Logout successful.' } };
    } catch (err) {
      console.error('Error during logout:', err);
      return {
        status: 500,
        data: { error: 'An internal server error occurred.' },
      };
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

  async deleteUser(id: string, sessionId: string, res: Response) {
    try {
      const existing = await pool.query(
        'SELECT * FROM users WHERE user_id = $1',
        [id],
      );

      if (existing.rows.length === 0) {
        return { status: 404, data: { error: 'User not found' } };
      }

      await pool.query('DELETE FROM users WHERE user_id = $1', [id]);
      await pool.query('DELETE FROM session WHERE sid = $1', [sessionId]);

      res.setHeader(
        'Set-Cookie',
        serialize('sid', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 0,
          path: '/',
        }),
      );

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

  // Password verification API endpoint:
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
}
