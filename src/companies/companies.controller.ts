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
import { CompaniesService } from './companies.service';
import { Response } from 'express';

@Controller('api/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get(':id')
  async getCompanies(@Param('id') id: string, @Res() res: Response) {
    const result = await this.companiesService.getCompanies(id);
    return res.status(result.status).json(result.data);
  }

  @Get()
  async getAllCompanies(@Res() res: Response) {
    const result = await this.companiesService.getCompanies(); // no ID = all
    return res.status(result.status).json(result.data);
  }

  @Post('add')
  async addCompany(@Body() body: any, @Res() res: Response) {
    const result = await this.companiesService.addCompany(body);
    return res.status(result.status).json(result.data);
  }

  @Delete('delete/:id')
  async deleteCompany(@Param('id') id: string, @Res() res: Response) {
    const result = await this.companiesService.deleteCompany(id);
    return res.status(result.status).json(result.data);
  }

  @Put('update')
  async updateCompany(@Body() body: any, @Res() res: Response) {
    const result = await this.companiesService.updateCompany(body);
    return res.status(result.status).json(result.data);
  }

  @Post('reset')
  async reset(@Body('userId') userId: number) {
    return this.companiesService.resetTable(userId);
  }
}
