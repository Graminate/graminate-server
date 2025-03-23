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
import { ContactsService } from './contacts.service';
import { Response } from 'express';

@Controller('api/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get(':id')
  async getContacts(@Param('id') id: string, @Res() res: Response) {
    const result = await this.contactsService.getContacts(id);
    return res.status(result.status).json(result.data);
  }

  @Get()
  async getAllContacts(@Res() res: Response) {
    const result = await this.contactsService.getContacts();
    return res.status(result.status).json(result.data);
  }

  @Post('add')
  async addContact(@Body() body: any, @Res() res: Response) {
    const result = await this.contactsService.addContact(body);
    return res.status(result.status).json(result.data);
  }

  @Delete('delete/:id')
  async deleteContact(@Param('id') id: string, @Res() res: Response) {
    const result = await this.contactsService.deleteContact(id);
    return res.status(result.status).json(result.data);
  }

  @Put('update')
  async updateContact(@Body() body: any, @Res() res: Response) {
    const result = await this.contactsService.updateContact(body);
    return res.status(result.status).json(result.data);
  }
}
