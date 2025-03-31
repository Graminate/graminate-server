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
import { LabourService } from './labour.service';
import { Response } from 'express';

@Controller('api/labour')
export class LabourController {
  constructor(private readonly labourService: LabourService) {}

  @Get(':id')
  async getLabours(@Param('id') id: string, @Res() res: Response) {
    const result = await this.labourService.getLabours(id);
    return res.status(result.status).json(result.data);
  }

  @Post('add')
  async addLabour(@Body() body: any, @Res() res: Response) {
    const result = await this.labourService.addLabour(body);
    return res.status(result.status).json(result.data);
  }

  @Delete('delete/:id')
  async deleteLabour(@Param('id') id: string, @Res() res: Response) {
    const result = await this.labourService.deleteLabour(id);
    return res.status(result.status).json(result.data);
  }

  @Put('update')
  async updateLabour(@Body() body: any, @Res() res: Response) {
    const result = await this.labourService.updateLabour(body);
    return res.status(result.status).json(result.data);
  }

  @Post('reset')
  async reset(@Body('userId') userId: number) {
    return this.labourService.resetTable(userId);
  }
}
