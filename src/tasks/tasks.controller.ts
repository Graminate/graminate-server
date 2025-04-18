import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, ResetTaskDto, UpdateTaskDto } from './tasks.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('api/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  async getTasks(@Param('userId', ParseIntPipe) userId: number) {
    const tasks = await this.tasksService.getTasksByUser(userId);
    return { tasks };
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async createTask(@Body() createTaskDto: CreateTaskDto) {
    const task = await this.tasksService.createTask(createTaskDto);
    return task;
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  async updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    const task = await this.tasksService.updateTask(id, updateTaskDto);
    return task;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteTask(@Param('id', ParseIntPipe) id: number) {
    const task = await this.tasksService.deleteTask(id);
    return task;
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async resetInventory(@Body() resetDto: ResetTaskDto) {
    return this.tasksService.resetTable(resetDto.userId);
  }
}
