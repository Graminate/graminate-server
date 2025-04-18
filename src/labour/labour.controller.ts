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
import { LabourService } from './labour.service';
import { Response } from 'express';
import { CreateOrUpdateLabourDto } from './labour.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('api/labour')
export class LabourController {
  constructor(private readonly labourService: LabourService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getLabours(@Param('id') id: string, @Res() res: Response) {
    const result = await this.labourService.getLabours(id);
    return res.status(result.status).json(result.data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addLabour(@Body() body: CreateOrUpdateLabourDto, @Res() res: Response) {
    const result = await this.labourService.addLabour(body);
    return res.status(result.status).json(result.data);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update')
  async updateLabour(
    @Body() body: CreateOrUpdateLabourDto,
    @Res() res: Response,
  ) {
    const result = await this.labourService.updateLabour(body);
    return res.status(result.status).json(result.data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteLabour(@Param('id') id: string, @Res() res: Response) {
    const result = await this.labourService.deleteLabour(id);
    return res.status(result.status).json(result.data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async reset(@Body('userId') userId: number) {
    return this.labourService.resetTable(userId);
  }
}
