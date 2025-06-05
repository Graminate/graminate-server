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
import { CattleMilkService } from './cattle-milk.service';
import {
  CreateCattleMilkDto,
  ResetCattleMilkDto,
  UpdateCattleMilkDto,
} from './cattle-milk.dto';

@Controller('api/cattle-milk')
export class CattleMilkController {
  constructor(private readonly cattleMilkService: CattleMilkService) {}

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  async getByUserId(@Param('userId', ParseIntPipe) userId: number) {
    const records = await this.cattleMilkService.findByUserId(userId);
    return { cattleMilkRecords: records };
  }

  @UseGuards(JwtAuthGuard)
  @Get('cattle/:cattleId')
  async getByCattleId(@Param('cattleId', ParseIntPipe) cattleId: number) {
    const records = await this.cattleMilkService.findByCattleId(cattleId);
    return { cattleMilkRecords: records };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const record = await this.cattleMilkService.findById(id);
    if (!record) {
      throw new HttpException(
        'Cattle milk record not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return record;
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addRecord(@Body() createDto: CreateCattleMilkDto) {
    return this.cattleMilkService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  async updateRecord(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCattleMilkDto,
  ) {
    const updatedRecord = await this.cattleMilkService.update(id, updateDto);
    if (!updatedRecord) {
      throw new HttpException(
        'Cattle milk record not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return updatedRecord;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteRecord(@Param('id', ParseIntPipe) id: number) {
    const deleted = await this.cattleMilkService.delete(id);
    if (!deleted) {
      throw new HttpException(
        'Cattle milk record not found or could not be deleted',
        HttpStatus.NOT_FOUND,
      );
    }
    return { message: 'Cattle milk record deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('animal-names/:cattleId')
  async getAnimalNamesForHerd(
    @Param('cattleId', ParseIntPipe) cattleId: number,
  ) {
    const names =
      await this.cattleMilkService.findAnimalNamesByCattleId(cattleId);
    return { animalNames: names };
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async resetWarehouse(@Body() resetDto: ResetCattleMilkDto) {
    return this.cattleMilkService.resetTable(resetDto.userId);
  }
}
