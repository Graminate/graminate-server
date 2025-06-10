import { Module } from '@nestjs/common';
import { ApicultureController } from './apiculture.controller';
import { ApicultureService } from './apiculture.service';

@Module({
  controllers: [ApicultureController],
  providers: [ApicultureService],
})
export class ApicultureModule {}
