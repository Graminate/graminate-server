import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './admin.dto';

@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** 1) Register */
  @Post('register')
  async register(@Body() dto: CreateAdminDto) {
    return this.adminService.register(
      dto.first_name,
      dto.last_name,
      dto.email,
      dto.password,
    );
  }

  /** 2) Login */
  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.adminService.login(email, password);
  }

  /** 3) List all users */
  @UseGuards(JwtAuthGuard)
  @Get('all-users')
  async allUsers(@Request() req) {
    if (!req.user?.isAdmin) throw new UnauthorizedException('Admins only');
    return this.adminService.getAllUsers();
  }

  /** 4) Total user count */
  @UseGuards(JwtAuthGuard)
  @Get('user-count')
  async userCount(@Request() req) {
    if (!req.user?.isAdmin) throw new UnauthorizedException('Admins only');
    return this.adminService.getUserCount();
  }
}
