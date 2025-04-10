import { Module } from '@nestjs/common';
import { PoultryHealthService } from './poultry-health.service';
import { PoultryHealthController } from './poultry-health.controller';

@Module({
  controllers: [PoultryHealthController],
  providers: [PoultryHealthService],
})
export class PoultryHealthModule {}
