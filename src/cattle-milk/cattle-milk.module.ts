import { Module } from '@nestjs/common';
import { CattleMilkController } from './cattle-milk.controller';
import { CattleMilkService } from './cattle-milk.service';

@Module({
  controllers: [CattleMilkController],
  providers: [CattleMilkService],
})
export class CattleMilkModule {}
