import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
} from '@nestjs/common';
import { PoultryHealthService } from './poultry-health.service';

@Controller('api/poultry_health')
export class PoultryHealthController {
  constructor(private readonly poultryHealthService: PoultryHealthService) {}

  @Get(':userId')
  async getHealthRecords(@Param('userId') userId: string) {
    const records = await this.poultryHealthService.getHealthRecords(userId);
    return { health: records };
  }

  @Post()
  async addHealthRecord(@Body() body: any) {
    const record = await this.poultryHealthService.addHealthRecord(body);
    return { health: record };
  }

  @Delete('delete/:id')
  async deleteHealthRecord(@Param('id') id: string) {
    return this.poultryHealthService.deleteHealthRecord(Number(id));
  }

  @Put(':id')
  async updateHealthRecord(@Param('id') id: string, @Body() body: any) {
    const record = await this.poultryHealthService.updateHealthRecord(
      Number(id),
      body,
    );
    return { health: record };
  }
}
