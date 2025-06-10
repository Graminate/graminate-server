import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { BeeHivesService } from './bee-hives.service';
import { CreateHiveDto, UpdateHiveDto, ResetHivesDto } from './bee-hives.dto';

@Controller('api/bee-hives')
@UseGuards(JwtAuthGuard)
export class BeeHivesController {
  constructor(private readonly hivesService: BeeHivesService) {}

  @Get('apiary/:apiaryId')
  async getByApiaryId(@Param('apiaryId', ParseIntPipe) apiaryId: number) {
    const hives = await this.hivesService.findByApiaryId(apiaryId);
    return { hives };
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.hivesService.findById(id);
  }

  @Post('add')
  async addHive(@Body() createDto: CreateHiveDto) {
    return this.hivesService.create(createDto);
  }

  @Put('update/:id')
  async updateHive(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateHiveDto,
  ) {
    return this.hivesService.update(id, updateDto);
  }

  @Delete('delete/:id')
  async deleteHive(@Param('id', ParseIntPipe) id: number) {
    const deleted = await this.hivesService.delete(id);
    if (!deleted) {
      throw new NotFoundException(
        `Hive with ID ${id} not found or could not be deleted`,
      );
    }
    return { message: 'Hive deleted successfully' };
  }

  @Post('reset')
  async reset(@Body() resetDto: ResetHivesDto) {
    return this.hivesService.resetTable(resetDto.userId);
  }
}
