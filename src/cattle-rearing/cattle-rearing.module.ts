import { Module } from '@nestjs/common';
import { CattleRearingController } from './cattle-rearing.controller';
import { CattleRearingService } from './cattle-rearing.service';

@Module({
  controllers: [CattleRearingController],
  providers: [CattleRearingService],
})
export class CattleRearingModule {}
