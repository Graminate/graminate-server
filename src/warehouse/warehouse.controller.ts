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
} from '@nestjs/common';

import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { WarehouseService } from './warehouse.service';
import {
  CreateWarehouseDto,
  ResetWarehouseDto,
  UpdateWarehouseDto,
} from './warehouse.dto';

@Controller('api/warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  async getByUserId(@Param('userId') userId: string) {
    const warehouses = await this.warehouseService.findByUserId(Number(userId));
    return { warehouses };
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addWarehouse(@Body() createDto: CreateWarehouseDto) {
    return this.warehouseService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  async updateWarehouse(
    @Param('id') id: string,
    @Body() updateDto: UpdateWarehouseDto,
  ) {
    const updated = await this.warehouseService.update(Number(id), updateDto);
    if (!updated) {
      throw new HttpException('Warehouse not found', HttpStatus.NOT_FOUND);
    }
    return updated;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteWarehouse(@Param('id') id: string) {
    const deleted = await this.warehouseService.delete(Number(id));
    if (!deleted) {
      throw new HttpException('Warehouse not found', HttpStatus.NOT_FOUND);
    }
    return { message: 'Deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async resetWarehouse(@Body() resetDto: ResetWarehouseDto) {
    return this.warehouseService.resetTable(resetDto.userId);
  }
}
