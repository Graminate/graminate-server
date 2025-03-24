import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { PasswordService } from './password.service';
import { Response } from 'express';

@Controller('api/password')
export class PasswordController {
  constructor(private readonly passwordService: PasswordService) {}

  @Post('forgot')
  async forgotPassword(@Body() body: any, @Res() res: Response) {
    const result = await this.passwordService.handleForgot(body.email);
    return res.status(result.status).json(result.data);
  }

  @Post('reset')
  async resetPassword(@Body() body: any, @Res() res: Response) {
    const result = await this.passwordService.handleReset(body);
    return res.status(result.status).json(result.data);
  }
}
