import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.adminService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user-count')
  async getUserCount(@Request() req) {
    if (!req.user?.isAdmin) {
      throw new UnauthorizedException('Admins only');
    }
    return this.adminService.getUserCount(); // or userService if injected
  }

  @UseGuards(JwtAuthGuard)
  @Get('all-users')
  async getAllUsers(@Request() req) {
    if (!req.user?.isAdmin) {
      throw new UnauthorizedException('Admins only');
    }
    return this.adminService.getAllUsersMinimal(); // or userService if injected
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    return this.adminService.logout();
  }
}
