import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  [x: string]: any;
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { userId: string }): Promise<any> {
    const admin = await this.adminService.findById(payload.userId);
    if (admin) {
      return { userId: payload.userId, isAdmin: true };
    }

    throw new UnauthorizedException('Access restricted to admins');
  }
}
