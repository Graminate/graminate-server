import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';

import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { FlockService } from './flock.service';
import { CreateFlockDto, UpdateFlockDto, ResetFlockDto } from './flock.dto';

@Controller('api/flock')
export class FlockController {
  constructor(private readonly flockService: FlockService) {}

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  async getByUserId(@Param('userId', ParseIntPipe) userId: number) {
    const flocks = await this.flockService.findByUserId(userId);
    return { flocks };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const flock = await this.flockService.findById(id);
    if (!flock) {
      throw new HttpException('Flock not found', HttpStatus.NOT_FOUND);
    }
    return flock;
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addFlock(@Body() createDto: CreateFlockDto) {
    return this.flockService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  async updateFlock(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateFlockDto,
  ) {
    const updatedFlock = await this.flockService.update(id, updateDto);
    if (!updatedFlock) {
      throw new HttpException('Flock not found', HttpStatus.NOT_FOUND);
    }
    return updatedFlock;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteFlock(@Param('id', ParseIntPipe) id: string) {
    const deleted = await this.flockService.delete(Number(id));
    if (!deleted) {
      throw new HttpException(
        'Flock not found or could not be deleted',
        HttpStatus.NOT_FOUND,
      );
    }
    return { message: 'Flock deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async resetFlocks(@Body() resetDto: ResetFlockDto) {
    return this.flockService.resetTable(resetDto.userId);
  }
}
