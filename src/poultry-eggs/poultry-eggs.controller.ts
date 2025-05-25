import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { PoultryEggsService } from './poultry-eggs.service';
import {
  CreatePoultryEggDto,
  UpdatePoultryEggDto,
  ResetPoultryEggDto,
} from './poultry-eggs.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('api/poultry-eggs')
export class PoultryEggsController {
  constructor(private readonly poultryEggsService: PoultryEggsService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  async getPoultryEggRecords(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('flockId') flockId?: string,
  ) {
    const records = await this.poultryEggsService.findByUserIdWithFilters(
      Number(userId),
      {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        flockId: flockId ? Number(flockId) : undefined,
      },
    );
    return { records };
  }

  @UseGuards(JwtAuthGuard)
  @Get('record/:id')
  async getPoultryEggRecordById(@Param('id') id: string) {
    const record = await this.poultryEggsService.findById(Number(id));
    if (!record) {
      throw new NotFoundException('Poultry egg record not found');
    }
    return record;
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addPoultryEggRecord(@Body() createDto: CreatePoultryEggDto) {
    const newRecord = await this.poultryEggsService.create(createDto);
    return newRecord;
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  async updatePoultryEggRecord(
    @Param('id') id: string,
    @Body() updateDto: UpdatePoultryEggDto,
  ) {
    const updatedRecord = await this.poultryEggsService.update(
      Number(id),
      updateDto,
    );
    if (!updatedRecord) {
      throw new NotFoundException('Poultry egg record not found');
    }
    return updatedRecord;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deletePoultryEggRecord(@Param('id') id: string) {
    const deleted = await this.poultryEggsService.delete(Number(id));
    if (!deleted) {
      throw new NotFoundException('Poultry egg record not found');
    }
    return { message: 'Poultry egg record deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async resetUserPoultryEggRecords(@Body() resetDto: ResetPoultryEggDto) {
    return this.poultryEggsService.resetTable(resetDto.userId);
  }
}
