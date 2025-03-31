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
} from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('api/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // GET: http://localhost:3001/api/inventory/:userId
  @Get(':userId')
  async getInventory(@Param('userId') userId: string) {
    const items = await this.inventoryService.findByUserId(Number(userId));
    return { items };
  }

  // POST: http://localhost:3001/api/inventory/add
  @Post('add')
  async addInventory(@Body() createDto: any) {
    const newItem = await this.inventoryService.create(createDto);
    return newItem;
  }

  // PUT: http://localhost:3001/api/inventory/update/:id
  @Put('update/:id')
  async updateInventory(@Param('id') id: string, @Body() updateDto: any) {
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
  async resetInventory(@Body('userId') userId: number) {
    return this.inventoryService.resetTable(userId);
  }
}
