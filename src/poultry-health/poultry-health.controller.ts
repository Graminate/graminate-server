import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PoultryHealthService } from './poultry-health.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('api/poultry_health')
export class PoultryHealthController {
  constructor(private readonly poultryHealthService: PoultryHealthService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  async getHealthRecords(@Param('userId') userId: string) {
    const records = await this.poultryHealthService.getHealthRecords(userId);
    return { health: records };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async addHealthRecord(@Body() body: any) {
    const record = await this.poultryHealthService.addHealthRecord(body);
    return { health: record };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteHealthRecord(@Param('id') id: string) {
    return this.poultryHealthService.deleteHealthRecord(Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateHealthRecord(@Param('id') id: string, @Body() body: any) {
    const record = await this.poultryHealthService.updateHealthRecord(
      Number(id),
      body,
    );
    return { health: record };
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async resetPoultryHealth() {
    await this.poultryHealthService.resetHealthRecords();
    return { message: 'Poultry health table reset successfully' };
  }
}
