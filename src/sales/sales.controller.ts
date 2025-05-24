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
  ParseIntPipe,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';

import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto, ResetSalesDto } from './sales.dto';

@Controller('api/sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  async getByUserId(@Param('userId', ParseIntPipe) userId: number) {
    const sales = await this.salesService.findByUserId(userId);
    return { sales };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const sale = await this.salesService.findById(id);
    if (!sale) {
      throw new HttpException('Sale not found', HttpStatus.NOT_FOUND);
    }
    return sale;
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addSale(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createDto: CreateSaleDto,
  ) {
    try {
      return await this.salesService.create(createDto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new HttpException(error.getResponse(), HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  async updateSale(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    updateDto: UpdateSaleDto,
  ) {
    try {
      const updatedSale = await this.salesService.update(id, updateDto);
      return updatedSale;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new HttpException(error.getResponse(), HttpStatus.BAD_REQUEST);
      }
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.NOT_FOUND
      ) {
        throw error;
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteSale(@Param('id', ParseIntPipe) id: number) {
    const deleted = await this.salesService.delete(id);
    if (!deleted) {
      throw new HttpException(
        'Sale not found or could not be deleted',
        HttpStatus.NOT_FOUND,
      );
    }
    return { message: 'Sale deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async resetInventory(@Body() resetDto: ResetSalesDto) {
    return this.salesService.resetTable(resetDto.userId);
  }
}
