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
import { ContractsService } from './contracts.service';
import { Response } from 'express';

@Controller('api/contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get(':id')
  async getContracts(@Param('id') id: string, @Res() res: Response) {
    const result = await this.contractsService.getContracts(id);
    return res.status(result.status).json(result.data);
  }

  @Post('add')
  async addContract(@Body() body: any, @Res() res: Response) {
    const result = await this.contractsService.addContract(body);
    return res.status(result.status).json(result.data);
  }

  @Delete('delete/:id')
  async deleteContract(@Param('id') id: string, @Res() res: Response) {
    const result = await this.contractsService.deleteContract(id);
    return res.status(result.status).json(result.data);
  }

  @Put('update')
  async updateContract(@Body() body: any, @Res() res: Response) {
    const result = await this.contractsService.updateContract(body);
    return res.status(result.status).json(result.data);
  }
}
