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
          },
        },
      };
    } catch (err) {
      console.error('Error fetching user:', err);
      return { status: 500, data: { error: 'Failed to fetch user' } };
    }
  }

  async updateUser(id: string, body: any) {
    const { first_name, last_name, phone_number, language, time_format } = body;

    try {
      await pool.query(
        `UPDATE users 
         SET first_name = $1, last_name = $2, phone_number = $3, language = $4, time_format = $5 
         WHERE user_id = $6`,
        [first_name, last_name, phone_number, language, time_format, id],
      );

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
        return { status: 401, data: { error: 'Invalid email or password.' } };
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
        `INSERT INTO users (first_name, last_name, email, phone_number, business_name, date_of_birth, password)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING user_id, first_name, last_name, email, phone_number, business_name`,
        [
          first_name,
          last_name,
          email,
          phone_number,
          business_name,
          date_of_birth,
          hashedPassword,
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
}
