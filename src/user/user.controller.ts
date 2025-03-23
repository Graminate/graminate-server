import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Req,
  Res,
  HttpStatus,
  UnauthorizedException,
  Delete,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { UserService } from './user.service';

@Controller('api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getUser(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const sessionId = req.cookies?.sid;
    const isAuthorized = await this.userService.validateSession(sessionId, id);
    if (!isAuthorized) throw new UnauthorizedException('Unauthorized');

    const result = await this.userService.getUserById(id);
    return res.status(result.status).json(result.data);
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const sessionId = req.cookies?.sid;
    const isAuthorized = await this.userService.validateSession(sessionId, id);
    if (!isAuthorized) throw new UnauthorizedException('Unauthorized');

    const result = await this.userService.updateUser(id, body);
    return res.status(result.status).json(result.data);
  }

  @Post('login')
  async login(@Body() body: any, @Res() res: Response) {
    const result = await this.userService.loginUser(body, res);
    return res.status(result.status).json(result.data);
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const sessionId = req.cookies?.sid;
    const result = await this.userService.logoutUser(sessionId, res);
    return res.status(result.status).json(result.data);
  }

  @Post('register')
  async register(@Body() body: any, @Res() res: Response) {
    const result = await this.userService.registerUser(body);
    return res.status(result.status).json(result.data);
  }

  @Delete('delete/:id')
  async deleteUser(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const sessionId = req.cookies?.sid;
    const isAuthorized = await this.userService.validateSession(sessionId, id);
    if (!isAuthorized) throw new UnauthorizedException('Unauthorized');

    const result = await this.userService.deleteUser(id, sessionId, res);
    return res.status(result.status).json(result.data);
  }
}
