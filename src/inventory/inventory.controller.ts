import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  ResetInventoryDto,
} from './inventory.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('api/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  async getInventory(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('item_group') itemGroup?: string,
    @Query('warehouse_id') warehouseId?: string,
  ) {
    const items = await this.inventoryService.findByUserIdWithFilters(
      Number(userId),
      {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        itemGroup: itemGroup,
        warehouseId: warehouseId ? Number(warehouseId) : undefined,
      },
    );
    return { items };
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addInventory(@Body() createDto: CreateInventoryDto) {
    const newItem = await this.inventoryService.create(createDto);
    return newItem;
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  async updateInventory(
    @Param('id') id: string,
    @Body() updateDto: UpdateInventoryDto,
  ) {
    const updatedItem = await this.inventoryService.update(
      Number(id),
      updateDto,
    );
    if (!updatedItem) {
      throw new HttpException('Inventory item not found', HttpStatus.NOT_FOUND);
    }
    return updatedItem;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteInventory(@Param('id') id: string) {
    const deleted = await this.inventoryService.delete(Number(id));
    if (!deleted) {
      throw new HttpException('Inventory item not found', HttpStatus.NOT_FOUND);
    }
    return { message: 'Deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async resetInventory(@Body() resetDto: ResetInventoryDto) {
    return this.inventoryService.resetTable(resetDto.userId);
  }
}
