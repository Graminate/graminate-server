import { Module } from '@nestjs/common';
import { FlockController } from './flock.controller';
import { FlockService } from './flock.service';

@Module({
  controllers: [FlockController],
  providers: [FlockService],
})
export class FlockModule {}
