import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  Body,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { Response } from 'express';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('api/receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getReceipts(@Param('id') id: string, @Res() res: Response) {
    const result = await this.receiptsService.getReceipts(id);
    return res.status(result.status).json(result.data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addReceipt(@Body() body: any, @Res() res: Response) {
    const result = await this.receiptsService.addReceipt(body);
    return res.status(result.status).json(result.data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteReceipt(@Param('id') id: string, @Res() res: Response) {
    const result = await this.receiptsService.deleteReceipt(id);
    return res.status(result.status).json(result.data);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update')
  async updateReceipt(@Body() body: any, @Res() res: Response) {
    const result = await this.receiptsService.updateReceipt(body);
    return res.status(result.status).json(result.data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async reset(@Body('userId') userId: number) {
    return this.receiptsService.resetTable(userId);
  }
}
