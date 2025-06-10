import { Module } from '@nestjs/common';
import { BeeHivesController } from './bee-hives.controller';
import { BeeHivesService } from './bee-hives.service';

@Module({
  controllers: [BeeHivesController],
  providers: [BeeHivesService],
})
export class BeeHivesModule {}
