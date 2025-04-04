import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Res,
} from '@nestjs/common';
import { LabourPaymentService } from './labour_payment.service';
import { Response } from 'express';

@Controller('api/labour_payment')
export class LabourPaymentController {
  constructor(private readonly labourPaymentService: LabourPaymentService) {}

  @Get(':labourId')
  async getPayments(@Param('labourId') labourId: string, @Res() res: Response) {
    const result = await this.labourPaymentService.getPayments(labourId);
    return res.status(result.status).json(result.data);
  }

  @Post('add')
  async addPayment(@Body() body: any, @Res() res: Response) {
    const result = await this.labourPaymentService.addPayment(body);
    return res.status(result.status).json(result.data);
  }

  @Put('update')
  async updatePayment(@Body() body: any, @Res() res: Response) {
    const result = await this.labourPaymentService.updatePayment(body);
    return res.status(result.status).json(result.data);
  }

  @Delete('delete/:paymentId')
  async deletePayment(
    @Param('paymentId') paymentId: string,
    @Res() res: Response,
  ) {
    const result = await this.labourPaymentService.deletePayment(paymentId);
    return res.status(result.status).json(result.data);
  }
}
