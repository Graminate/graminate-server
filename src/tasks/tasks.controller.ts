import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, ResetTaskDto, UpdateTaskDto } from './tasks.dto';

@Controller('api/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get(':userId')
  async getTasks(@Param('userId', ParseIntPipe) userId: number) {
    const tasks = await this.tasksService.getTasksByUser(userId);
    return { tasks };
  }

  @Post('add')
  async createTask(@Body() createTaskDto: CreateTaskDto) {
    const task = await this.tasksService.createTask(createTaskDto);
    return task;
  }

  @Put('update/:id')
  async updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    const task = await this.tasksService.updateTask(id, updateTaskDto);
    return task;
  }

  @Delete('delete/:id')
  async deleteTask(@Param('id', ParseIntPipe) id: number) {
    const task = await this.tasksService.deleteTask(id);
    return task;
  }

  @Post('reset')
  async resetInventory(@Body() resetDto: ResetTaskDto) {
    return this.tasksService.resetTable(resetDto.userId);
  }
}
