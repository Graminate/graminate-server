import { Module } from '@nestjs/common';
import { FisheryController } from './fishery.controller';
import { FisheryService } from './fishery.service';

@Module({
  controllers: [FisheryController],
  providers: [FisheryService],
})
export class FisheryModule {}
