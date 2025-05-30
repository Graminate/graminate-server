import { Module } from '@nestjs/common';
import { PoultryFeedsController } from './poultry-feeds.controller';
import { PoultryFeedsService } from './poultry-feeds.service';

@Module({
  controllers: [PoultryFeedsController],
  providers: [PoultryFeedsService],
})
export class PoultryFeedsModule {}
