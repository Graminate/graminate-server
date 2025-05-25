import { Module } from '@nestjs/common';
import { PoultryEggsController } from './poultry-eggs.controller';
import { PoultryEggsService } from './poultry-eggs.service';

@Module({
  controllers: [PoultryEggsController],
  providers: [PoultryEggsService],
})
export class PoultryEggsModule {}
