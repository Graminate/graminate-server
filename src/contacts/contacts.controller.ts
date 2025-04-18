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
  UseGuards,
} from '@nestjs/common';
import { CreateContactDto } from './contacts.dto';
import { ContactsService } from './contacts.service';
import { Response } from 'express';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('api/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getContacts(@Param('id') id: string, @Res() res: Response) {
    const result = await this.contactsService.getContacts(id);
    return res.status(result.status).json(result.data);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllContacts(@Res() res: Response) {
    const result = await this.contactsService.getContacts();
    return res.status(result.status).json(result.data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async addContact(@Body() body: CreateContactDto, @Res() res: Response) {
    const result = await this.contactsService.addContact(body);
    return res.status(result.status).json(result.data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteContact(@Param('id') id: string, @Res() res: Response) {
    const result = await this.contactsService.deleteContact(id);
    return res.status(result.status).json(result.data);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update')
  async updateContact(@Body() body: any, @Res() res: Response) {
    const result = await this.contactsService.updateContact(body);
    return res.status(result.status).json(result.data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async reset(@Body('userId') userId: number) {
    return this.contactsService.resetTable(userId);
  }
}
