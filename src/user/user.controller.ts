import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Delete,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { UserService } from './user.service';

@Controller('api/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.userService.registerUser(body);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/available-sub-types')
  async getAvailableSubTypes(@Param('id') id: string, @Request() req) {
    if (String(req.user.userId) !== id) throw new UnauthorizedException();
    return this.userService.getAvailableSubTypes(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUser(@Param('id') id: string, @Request() req) {
    if (String(req.user.userId) !== id) throw new UnauthorizedException();
    return this.userService.getUserById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() body: any, @Request() req) {
    if (String(req.user.userId) !== id) throw new UnauthorizedException();
    return this.userService.updateUser(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteUser(@Param('id') id: string, @Request() req) {
    if (String(req.user.userId) !== id) throw new UnauthorizedException();
    return this.userService.deleteUser(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-password/:id')
  async verifyPassword(
    @Param('id') userId: string,
    @Body('password') password: string,
    @Request() req,
  ) {
    if (String(req.user.userId) !== userId) throw new UnauthorizedException();
    const result = await this.userService.verifyPassword(userId, password);
    return result.data;
  }
}
