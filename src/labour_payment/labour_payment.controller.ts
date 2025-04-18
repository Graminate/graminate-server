import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Res,
  UseGuards,
} from '@nestjs/common';
import { LabourPaymentService } from './labour_payment.service';
import { Response } from 'express';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('api/labour_payment')
export class LabourPaymentController {
  constructor(private readonly labourPaymentService: LabourPaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':labourId')
  async getPayments(@Param('labourId') labourId: string, @Res() res: Response) {
    const result = await this.labourPaymentService.getPayments(labourId);
    return res.status(result.status).json(result.data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addPayment(@Body() body: any, @Res() res: Response) {
    const result = await this.labourPaymentService.addPayment(body);
    return res.status(result.status).json(result.data);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update')
  async updatePayment(@Body() body: any, @Res() res: Response) {
    const result = await this.labourPaymentService.updatePayment(body);
    return res.status(result.status).json(result.data);
  }
}
