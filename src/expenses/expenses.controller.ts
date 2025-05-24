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
import { ExpensesService } from './expenses.service';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ResetExpensesDto,
} from './expenses.dto';

@Controller('api/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  async getByUserId(@Param('userId', ParseIntPipe) userId: number) {
    const expenses = await this.expensesService.findByUserId(userId);
    return { expenses };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const expense = await this.expensesService.findById(id);
    if (!expense) {
      throw new HttpException('Expense not found', HttpStatus.NOT_FOUND);
    }
    return expense;
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addExpense(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createDto: CreateExpenseDto,
  ) {
    try {
      return await this.expensesService.create(createDto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new HttpException(error.getResponse(), HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  async updateExpense(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    updateDto: UpdateExpenseDto,
  ) {
    try {
      const updatedExpense = await this.expensesService.update(id, updateDto);
      return updatedExpense;
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
  async deleteExpense(@Param('id', ParseIntPipe) id: number) {
    const deleted = await this.expensesService.delete(id);
    if (!deleted) {
      throw new HttpException(
        'Expense not found or could not be deleted',
        HttpStatus.NOT_FOUND,
      );
    }
    return { message: 'Expense deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async reset(@Body('userId') userId: number) {
    return this.expensesService.resetTable(userId);
  }
}
