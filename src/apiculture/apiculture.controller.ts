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
import { ApicultureService } from './apiculture.service';
import { CreateApiaryDto, UpdateApiaryDto } from './apiculture.dto';

@Controller('api/apiculture')
export class ApicultureController {
  constructor(private readonly apicultureService: ApicultureService) {}

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  async getByUserId(@Param('userId', ParseIntPipe) userId: number) {
    const apiaries = await this.apicultureService.findByUserId(userId);
    return { apiaries };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const apiary = await this.apicultureService.findById(id);
    if (!apiary) {
      throw new HttpException('Apiary record not found', HttpStatus.NOT_FOUND);
    }
    return apiary;
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addApiary(@Body() createDto: CreateApiaryDto) {
    return this.apicultureService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  async updateApiary(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateApiaryDto,
  ) {
    const updatedApiary = await this.apicultureService.update(id, updateDto);
    if (!updatedApiary) {
      throw new HttpException('Apiary record not found', HttpStatus.NOT_FOUND);
    }
    return updatedApiary;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteApiary(@Param('id', ParseIntPipe) id: number) {
    const deleted = await this.apicultureService.delete(id);
    if (!deleted) {
      throw new HttpException(
        'Apiary record not found or could not be deleted',
        HttpStatus.NOT_FOUND,
      );
    }
    return { message: 'Apiary record deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async reset(@Body('userId') userId: number) {
    return this.apicultureService.resetTable(userId);
  }
}
