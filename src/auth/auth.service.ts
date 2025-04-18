import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private users: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
    const userRecord = await this.users.findByEmail(email);
    if (!userRecord) throw new UnauthorizedException();
    const valid = await argon2.verify(userRecord.password, pass);
    if (!valid) throw new UnauthorizedException();
    return userRecord;
  }

  async login(email: string, pass: string) {
    const user = await this.validateUser(email, pass);
    const payload = { userId: user.user_id };
    return {
      access_token: this.jwtService.sign(payload),
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
}
