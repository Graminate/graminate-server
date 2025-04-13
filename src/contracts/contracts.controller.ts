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
  ParseIntPipe,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { Response } from 'express';
import { CreateContractDto, UpdateContractDto } from './contracts.dto';

@Controller('api/contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get(':userId')
  async getContractsByUserId(@Param('userId', ParseIntPipe) userId: number, @Res() res: Response) {
    const result = await this.contractsService.getContracts(userId);
    return res.status(result.status).json(result.data);
  }

  @Get()
  async getAllContracts(@Res() res: Response) {
    const result = await this.contractsService.getContracts();
    return res.status(result.status).json(result.data);
  }

  // POST /api/contracts/add
  @Post('add')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async addContract(@Body() createContractDto: CreateContractDto, @Res() res: Response) {
    const result = await this.contractsService.addContract(createContractDto);
    if (result.status >= 500) {
      console.error('Controller error while adding contract:', result.data.error);
    }
    return res.status(result.status).json(result.data);
  }

  // DELETE /api/contracts/delete/:id
  @Delete('delete/:id')
  async deleteContract(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const result = await this.contractsService.deleteContract(id);
    return res.status(result.status).json(result.data);
  }

  // PUT /api/contracts/update
  @Put('update')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateContract(
    @Body() updateContractDto: UpdateContractDto,
    @Res() res: Response,
  ) {
    const result = await this.contractsService.updateContract(updateContractDto);
    return res.status(result.status).json(result.data);
  }
  // POST /api/contracts/reset
  @Post('reset')
  async reset(@Body('userId') userId: number) {
    return this.contractsService.resetTable(userId);
  }
}
