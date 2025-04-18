import { Module } from '@nestjs/common';
import { LabourPaymentController } from './labour_payment.controller';
import { LabourPaymentService } from './labour_payment.service';

@Module({
  controllers: [LabourPaymentController],
  providers: [LabourPaymentService],
})
export class LabourPaymentModule {}
