import { Module } from '@nestjs/common';
import { PoultryHealthController } from './poultry-health.controller';
import { PoultryHealthService } from './poultry-health.service';

@Module({
  controllers: [PoultryHealthController],
  providers: [PoultryHealthService],
})
export class PoultryHealthModule {}
