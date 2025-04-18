import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  Body,
  Res,
  UsePipes,
  ValidationPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { Response } from 'express';
import { CreateCompanyDto } from './companies.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('api/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getCompanies(@Param('id') id: string, @Res() res: Response) {
    const result = await this.companiesService.getCompanies(id);
    return res.status(result.status).json(result.data);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllCompanies(
    @Res() res: Response,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit) : undefined;
    const parsedOffset = offset ? parseInt(offset) : undefined;
    const result = await this.companiesService.getCompanies(
      undefined,
      parsedLimit,
      parsedOffset,
    );
    return res.status(result.status).json(result.data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async addCompany(@Body() body: CreateCompanyDto, @Res() res: Response) {
    const result = await this.companiesService.addCompany(body);
    return res.status(result.status).json(result.data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteCompany(@Param('id') id: string, @Res() res: Response) {
    const result = await this.companiesService.deleteCompany(id);
    return res.status(result.status).json(result.data);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateCompany(@Body() body: any, @Res() res: Response) {
    const result = await this.companiesService.updateCompany(body);
    return res.status(result.status).json(result.data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async reset(@Body('userId') userId: number, @Res() res: Response) {
    try {
      const result = await this.companiesService.resetTable(userId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to reset companies table' });
    }
  }
}
