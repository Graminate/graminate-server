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
import { CattleRearingService } from './cattle-rearing.service';
import {
  CreateCattleRearingDto,
  UpdateCattleRearingDto,
} from './cattle-rearing.dto';

@Controller('api/cattle-rearing')
export class CattleRearingController {
  constructor(private readonly cattleRearingService: CattleRearingService) {}

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  async getByUserId(@Param('userId', ParseIntPipe) userId: number) {
    const cattleRearings = await this.cattleRearingService.findByUserId(userId);
    return { cattleRearings };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const cattleRearing = await this.cattleRearingService.findById(id);
    if (!cattleRearing) {
      throw new HttpException(
        'Cattle rearing record not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return cattleRearing;
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addCattleRearing(@Body() createDto: CreateCattleRearingDto) {
    return this.cattleRearingService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  async updateCattleRearing(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCattleRearingDto,
  ) {
    const updatedCattleRearing = await this.cattleRearingService.update(
      id,
      updateDto,
    );
    if (!updatedCattleRearing) {
      throw new HttpException(
        'Cattle rearing record not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return updatedCattleRearing;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteCattleRearing(@Param('id', ParseIntPipe) id: number) {
    const deleted = await this.cattleRearingService.delete(id);
    if (!deleted) {
      throw new HttpException(
        'Cattle rearing record not found or could not be deleted',
        HttpStatus.NOT_FOUND,
      );
    }
    return { message: 'Cattle rearing record deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async reset(@Body('userId', ParseIntPipe) userId: number) {
    return this.cattleRearingService.resetTable(userId);
  }
}
