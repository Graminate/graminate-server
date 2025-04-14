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
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  ResetInventoryDto,
} from './inventory.dto';

@Controller('api/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // GET: http://localhost:3001/api/inventory/:userId?limit=&offset=&item_group=
  @Get(':userId')
  async getInventory(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('item_group') itemGroup?: string,
  ) {
    let items = await this.inventoryService.findByUserId(Number(userId));
    // Optional filtering based on item_group.
    if (itemGroup) {
      items = items.filter((item) => item.item_group === itemGroup);
    }
    // Optional pagination.
    if (offset) {
      items = items.slice(Number(offset));
    }
    if (limit) {
      items = items.slice(0, Number(limit));
    }
    return { items };
  }

  // POST: http://localhost:3001/api/inventory/add
  @Post('add')
  async addInventory(@Body() createDto: CreateInventoryDto) {
    const newItem = await this.inventoryService.create(createDto);
    return newItem;
  }

  // PUT: http://localhost:3001/api/inventory/update/:id
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
  @Delete('delete/:id')
  async deleteInventory(@Param('id') id: string) {
    const deleted = await this.inventoryService.delete(Number(id));
    if (!deleted) {
      throw new HttpException('Inventory item not found', HttpStatus.NOT_FOUND);
    }
    return { message: 'Deleted successfully' };
  }

  // POST: http://localhost:3001/api/inventory/reset
  @Post('reset')
  async resetInventory(@Body() resetDto: ResetInventoryDto) {
    return this.inventoryService.resetTable(resetDto.userId);
  }
}
