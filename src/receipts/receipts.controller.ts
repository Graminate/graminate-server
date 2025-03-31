import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  Body,
  Res,
} from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { Response } from 'express';

@Controller('api/receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get(':id')
  async getReceipts(@Param('id') id: string, @Res() res: Response) {
    const result = await this.receiptsService.getReceipts(id);
    return res.status(result.status).json(result.data);
  }

  @Post('add')
  async addReceipt(@Body() body: any, @Res() res: Response) {
    const result = await this.receiptsService.addReceipt(body);
    return res.status(result.status).json(result.data);
  }

  @Delete('delete/:id')
  async deleteReceipt(@Param('id') id: string, @Res() res: Response) {
    const result = await this.receiptsService.deleteReceipt(id);
    return res.status(result.status).json(result.data);
  }

  @Put('update')
  @Post('update')
  async updateReceipt(@Body() body: any, @Res() res: Response) {
    const result = await this.receiptsService.updateReceipt(body);
    return res.status(result.status).json(result.data);
  }

  @Post('reset')
  async reset(@Body('userId') userId: number) {
    return this.receiptsService.resetTable(userId);
  }
}
