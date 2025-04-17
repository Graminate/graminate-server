import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import pool from '@/config/database';

@Injectable()
export class AdminService {
  getUserCount() {
    throw new Error('Method not implemented.');
  }
  getAllUsersMinimal() {
    throw new Error('Method not implemented.');
  }
  constructor(private jwtService: JwtService) {}

  async login(email: string, password: string) {
    const result = await pool.query('SELECT * FROM admin WHERE email = $1', [
      email,
    ]);
    const admin = result.rows[0];
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    const isValid = await argon2.verify(admin.password, password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    const payload = { isAdmin: true }; // No need for user id
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
    };
  }

  async logout() {
    return {
      message: 'Logout successful',
    };
  }
}
