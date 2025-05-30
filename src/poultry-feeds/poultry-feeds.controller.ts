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
import { PoultryFeedsService } from './poultry-feeds.service';
import {
  CreatePoultryFeedDto,
  UpdatePoultryFeedDto,
  ResetPoultryFeedsDto,
} from './poultry-feeds.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('api/poultry-feeds')
export class PoultryFeedsController {
  constructor(private readonly poultryFeedsService: PoultryFeedsService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  async getPoultryFeedRecords(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('flockId') flockId?: string,
  ) {
    const records = await this.poultryFeedsService.findByUserIdWithFilters(
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
  async getPoultryFeedRecordById(@Param('id') id: string) {
    const record = await this.poultryFeedsService.findById(Number(id));
    if (!record) {
      throw new NotFoundException('Poultry feed record not found');
    }
    return record;
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addPoultryFeedRecord(@Body() createDto: CreatePoultryFeedDto) {
    const newRecord = await this.poultryFeedsService.create(createDto);
    return newRecord;
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  async updatePoultryFeedRecord(
    @Param('id') id: string,
    @Body() updateDto: UpdatePoultryFeedDto,
  ) {
    const updatedRecord = await this.poultryFeedsService.update(
      Number(id),
      updateDto,
    );
    if (!updatedRecord) {
      throw new NotFoundException('Poultry feed record not found');
    }
    return updatedRecord;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deletePoultryFeedRecord(@Param('id') id: string) {
    const deleted = await this.poultryFeedsService.delete(Number(id));
    if (!deleted) {
      throw new NotFoundException('Poultry feed record not found');
    }
    return { message: 'Poultry feed record deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async resetUserPoultryFeedRecords(@Body() resetDto: ResetPoultryFeedsDto) {
    return this.poultryFeedsService.resetTable(resetDto.userId);
  }
}
