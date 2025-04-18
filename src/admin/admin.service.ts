import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import pool from '@/config/database';
import { UserService } from '@/user/user.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async register(
    first_name: string,
    last_name: string,
    email: string,
    password: string,
  ) {
    const { rows } = await pool.query('SELECT 1 FROM admin WHERE email = $1', [
      email,
    ]);
    if (rows.length) {
      throw new ConflictException('Admin with that email already exists');
    }

    const hash = await argon2.hash(password);
    const result = await pool.query(
      `INSERT INTO admin (first_name, last_name, email, password)
       VALUES ($1, $2, $3, $4)
       RETURNING admin_id, first_name, last_name, email`,
      [first_name, last_name, email, hash],
    );

    return {
      status: 201,
      data: { admin: result.rows[0], message: 'Admin registered' },
    };
  }

  async login(email: string, password: string) {
    const { rows } = await pool.query('SELECT * FROM admin WHERE email = $1', [
      email,
    ]);
    const admin = rows[0];
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(admin.password, password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      isAdmin: true,
      adminId: admin.admin_id,
    });
    return { status: 200, data: { access_token: token } };
  }

  /** 3) Fetch all users - Need fixing */
  async getAllUsers() {
    try {
      const result = await pool.query(
        `SELECT user_id, first_name, last_name, email, business_name, type
       FROM users
       ORDER BY created_at DESC`,
      );

      return {
        status: 200,
        data: {
          users: result.rows,
        },
      };
    } catch (err) {
      console.error('Error fetching all users:', err);
      return {
        status: 500,
        data: {
          error: 'Failed to fetch users',
        },
      };
    }
  }

  /** 4) Fetch user count */
  async getUserCount() {
    const { rows } = await pool.query('SELECT COUNT(*) AS count FROM users');
    return { status: 200, data: { count: rows[0].count } };
  }
}
