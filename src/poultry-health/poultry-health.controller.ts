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
import { PoultryHealthService } from './poultry-health.service';
import {
  CreatePoultryHealthDto,
  UpdatePoultryHealthDto,
  ResetPoultryHealthDto,
} from './poultry-health.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('api/poultry-health')
export class PoultryHealthController {
  constructor(private readonly poultryHealthService: PoultryHealthService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  async getPoultryHealthRecords(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('flockId') flockId?: string,
  ) {
    const records = await this.poultryHealthService.findByUserIdWithFilters(
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
  async getPoultryHealthRecordById(@Param('id') id: string) {
    const record = await this.poultryHealthService.findById(Number(id));
    if (!record) {
      throw new NotFoundException('Poultry health record not found');
    }
    return record;
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addPoultryHealthRecord(@Body() createDto: CreatePoultryHealthDto) {
    const newRecord = await this.poultryHealthService.create(createDto);
    return newRecord;
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  async updatePoultryHealthRecord(
    @Param('id') id: string,
    @Body() updateDto: UpdatePoultryHealthDto,
  ) {
    const updatedRecord = await this.poultryHealthService.update(
      Number(id),
      updateDto,
    );
    if (!updatedRecord) {
      throw new NotFoundException('Poultry health record not found');
    }
    return updatedRecord;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deletePoultryHealthRecord(@Param('id') id: string) {
    const deleted = await this.poultryHealthService.delete(Number(id));
    if (!deleted) {
      throw new NotFoundException('Poultry health record not found');
    }
    return { message: 'Poultry health record deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async resetUserPoultryHealthRecords(@Body() resetDto: ResetPoultryHealthDto) {
    return this.poultryHealthService.resetTable(resetDto.userId);
  }
}
