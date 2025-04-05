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
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { Response } from 'express';
import { CreateCompanyDto } from './companies.dto';

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
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async addCompany(@Body() body: CreateCompanyDto, @Res() res: Response) {
    const result = await this.companiesService.addCompany(body);
    return res.status(result.status).json(result.data);
  }

  @Delete('delete/:id')
  async deleteCompany(@Param('id') id: string, @Res() res: Response) {
    const result = await this.companiesService.deleteCompany(id);
    return res.status(result.status).json(result.data);
  }

  @Put('update')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateCompany(@Body() body: any, @Res() res: Response) {
    const result = await this.companiesService.updateCompany(body);
    return res.status(result.status).json(result.data);
  }

  @Post('reset')
  async reset(@Body('userId') userId: number) {
    return this.companiesService.resetTable(userId);
  }
}
