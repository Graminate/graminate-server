import { Controller, Post, Body, Res, Req, HttpStatus } from '@nestjs/common';
import { OtpService } from './otp.service';
import { Response } from 'express';

@Controller('api/otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send-otp')
  async sendOtp(@Body() body: any, @Res() res: Response) {
    const result = await this.otpService.sendOtp(body.email);
    return res.status(result.status).json(result.data);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: any, @Res() res: Response) {
    const result = await this.otpService.verifyOtp(body.email, body.otp);
    return res.status(result.status).json(result.data);
  }
}
