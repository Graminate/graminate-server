// inventory.controller.ts
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
  CreateInventoryDto, // Ensure this is imported
  UpdateInventoryDto,
  ResetInventoryDto,
} from './inventory.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('api/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // GET: http://localhost:3001/api/inventory/:userId?limit=&offset=&item_group=&warehouse_id=
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

  // POST: http://localhost:3001/api/inventory/add
  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addInventory(@Body() createDto: CreateInventoryDto) {
    // Use CreateInventoryDto
    const newItem = await this.inventoryService.create(createDto);
    return newItem;
  }

  // PUT: http://localhost:3001/api/inventory/update/:id
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

  // DELETE: http://localhost:3001/api/inventory/delete/:id
  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteInventory(@Param('id') id: string) {
    const deleted = await this.inventoryService.delete(Number(id));
    if (!deleted) {
      throw new HttpException('Inventory item not found', HttpStatus.NOT_FOUND);
    }
    return { message: 'Deleted successfully' };
  }

  // POST: http://localhost:3001/api/inventory/reset
  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async resetInventory(@Body() resetDto: ResetInventoryDto) {
    // Consider the scope of resetTable as mentioned in the service.
    return this.inventoryService.resetTable(resetDto.userId);
  }
}
