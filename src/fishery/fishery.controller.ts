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
import { FisheryService } from './fishery.service';
import {
  CreateFisheryDto,
  UpdateFisheryDto,
  ResetFisheryDto,
} from './fishery.dto';

@Controller('api/fishery')
export class FisheryController {
  constructor(private readonly fisheryService: FisheryService) {}

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  async getByUserId(@Param('userId', ParseIntPipe) userId: number) {
    const fisheries = await this.fisheryService.findByUserId(userId);
    return { fisheries };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const fishery = await this.fisheryService.findById(id);
    if (!fishery) {
      throw new HttpException('Fishery not found', HttpStatus.NOT_FOUND);
    }
    return fishery;
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addFishery(@Body() createDto: CreateFisheryDto) {
    return this.fisheryService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  async updateFishery(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateFisheryDto,
  ) {
    const updatedFishery = await this.fisheryService.update(id, updateDto);
    if (!updatedFishery) {
      throw new HttpException('Fishery not found', HttpStatus.NOT_FOUND);
    }
    return updatedFishery;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteFishery(@Param('id', ParseIntPipe) id: number) {
    const deleted = await this.fisheryService.delete(id);
    if (!deleted) {
      throw new HttpException(
        'Fishery not found or could not be deleted',
        HttpStatus.NOT_FOUND,
      );
    }
    return { message: 'Fishery deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async reset(@Body() resetDto: ResetFisheryDto) {
    return this.fisheryService.resetTable(resetDto.userId);
  }
}
