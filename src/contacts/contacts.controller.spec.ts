import { Test, TestingModule } from '@nestjs/testing';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { Response } from 'express';
import { CreateContactDto } from './contacts.dto';

type MockContactsService = {
  [K in keyof ContactsService]: jest.Mock;
};

const createMockContactsService = (): MockContactsService => ({
  getContacts: jest.fn(),
  addContact: jest.fn(),
  deleteContact: jest.fn(),
  updateContact: jest.fn(),
  resetTable: jest.fn(),
});

const createMockResponse = (): {
  res: Partial<Response>;
  statusMock: jest.Mock;
  jsonMock: jest.Mock;
} => {
  const jsonMock = jest.fn();
  const statusMock = jest.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  const res: Partial<Response> = {
    status: statusMock as unknown as Response['status'],
    json: jsonMock,
    setHeader: jest.fn(),
  };
  return { res, statusMock, jsonMock };
};

describe('ContactsController', () => {
  let controller: ContactsController;
  let contactsService: MockContactsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [
        {
          provide: ContactsService,
          useValue: createMockContactsService(),
        },
      ],
    }).compile();

    controller = module.get<ContactsController>(ContactsController);
    contactsService = module.get(ContactsService);
  });

  // GET /api/contacts/:id
  describe('GET /api/contacts/:id', () => {
    it('should return contacts for a given user id', async () => {
      const userId = '123';
      const resultData = { contacts: [{ contact_id: 1, user_id: 123 }] };
      const serviceResult = { status: 200, data: resultData };
      contactsService.getContacts.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.getContacts(userId, res as Response);

      expect(contactsService.getContacts).toHaveBeenCalledWith(userId);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(resultData);
    });

    it('should return error if service returns error for GET /:id', async () => {
      const userId = 'abc';
      const serviceResult = {
        status: 400,
        data: { error: 'Invalid user ID parameter' },
      };
      contactsService.getContacts.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.getContacts(userId, res as Response);

      expect(contactsService.getContacts).toHaveBeenCalledWith(userId);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });
  });

  // GET /api/contacts
  describe('GET /api/contacts', () => {
    it('should return all contacts when no id is provided', async () => {
      const resultData = { contacts: [{ contact_id: 1, user_id: 123 }] };
      const serviceResult = { status: 200, data: resultData };
      contactsService.getContacts.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.getAllContacts(res as Response);

      expect(contactsService.getContacts).toHaveBeenCalledWith();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(resultData);
    });

    it('should return error if service fails for GET /', async () => {
      const serviceResult = {
        status: 500,
        data: { error: 'Failed to fetch contacts' },
      };
      contactsService.getContacts.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.getAllContacts(res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });
  });

  // POST /api/contacts/add
  describe('POST /api/contacts/add', () => {
    it('should add a contact and return success response', async () => {
      const contactDto: CreateContactDto = {
        user_id: 123,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone_number: '+1234567890',
        type: 'friend',
        address_line_1: '123 Main St',
        address_line_2: 'Apt 4',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
      };
      const serviceResult = {
        status: 201,
        data: {
          message: 'Contact added successfully',
          contact: { id: 1, ...contactDto },
        },
      };
      contactsService.addContact.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.addContact(contactDto, res as Response);

      expect(contactsService.addContact).toHaveBeenCalledWith(contactDto);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('should return error if required fields are missing', async () => {
      // Simulate missing required fields (for example, missing first_name)
      const incompleteDto = { user_id: 123 } as any;
      const serviceResult = {
        status: 400,
        data: { error: 'Missing required fields' },
      };
      contactsService.addContact.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.addContact(incompleteDto, res as Response);

      expect(contactsService.addContact).toHaveBeenCalledWith(incompleteDto);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('should return 500 if service error occurs during addContact', async () => {
      const contactDto: CreateContactDto = {
        user_id: 123,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone_number: '+1234567890',
        type: 'friend',
        address_line_1: '123 Main St',
        address_line_2: 'Apt 4',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
      };
      const serviceResult = {
        status: 500,
        data: { error: 'Failed to add contact' },
      };
      contactsService.addContact.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.addContact(contactDto, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });
  });

  // DELETE /api/contacts/delete/:id
  describe('DELETE /api/contacts/delete/:id', () => {
    it('should delete a contact and return success response', async () => {
      const contactId = '1';
      const serviceResult = {
        status: 200,
        data: {
          message: 'Contact deleted successfully',
          contact: { contact_id: 1 },
        },
      };
      contactsService.deleteContact.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.deleteContact(contactId, res as Response);

      expect(contactsService.deleteContact).toHaveBeenCalledWith(contactId);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('should return error for invalid contact id', async () => {
      const contactId = 'invalid';
      const serviceResult = {
        status: 400,
        data: { error: 'Invalid contact ID' },
      };
      contactsService.deleteContact.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.deleteContact(contactId, res as Response);

      expect(contactsService.deleteContact).toHaveBeenCalledWith(contactId);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('should return 500 if service error occurs during delete', async () => {
      const contactId = '2';
      const serviceResult = {
        status: 500,
        data: { error: 'Failed to delete contact' },
      };
      contactsService.deleteContact.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.deleteContact(contactId, res as Response);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });
  });

  // PUT /api/contacts/update
  describe('PUT /api/contacts/update', () => {
    it('should update a contact and return success response', async () => {
      const updateData = {
        id: '1',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane.doe@example.com',
        phone_number: '+1234567890',
        type: 'family',
        address_line_1: '456 Second St',
        address_line_2: 'Suite 5',
        city: 'Los Angeles',
        state: 'CA',
        postal_code: '90001',
      };
      const serviceResult = {
        status: 200,
        data: {
          message: 'Contact updated successfully',
          contact: { contact_id: 1, ...updateData },
        },
      };
      contactsService.updateContact.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.updateContact(updateData, res as Response);

      expect(contactsService.updateContact).toHaveBeenCalledWith(updateData);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('should return error if update data is invalid', async () => {
      // For example, invalid contact id passed in updateData
      const updateData = { id: 'invalid', first_name: 'Jane' };
      const serviceResult = {
        status: 400,
        data: { error: 'Invalid contact ID' },
      };
      contactsService.updateContact.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.updateContact(updateData, res as Response);

      expect(contactsService.updateContact).toHaveBeenCalledWith(updateData);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('should return 500 if service error occurs during update', async () => {
      const updateData = { id: '3', first_name: 'Jane' };
      const serviceResult = {
        status: 500,
        data: { error: 'Failed to update contact' },
      };
      contactsService.updateContact.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.updateContact(updateData, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });
  });

  // POST /api/contacts/reset
  describe('POST /api/contacts/reset', () => {
    it('should reset the contacts table', async () => {
      const userId = 123;
      const serviceResult = {
        message: `Contacts table reset for user ${userId}`,
      };
      contactsService.resetTable.mockResolvedValueOnce(serviceResult);

      const result = await controller.reset(userId);
      expect(contactsService.resetTable).toHaveBeenCalledWith(userId);
      expect(result).toEqual(serviceResult);
    });
  });

  describe('Stress test for getContacts (concurrent requests)', () => {
    it('should handle concurrent getContacts requests without failure', async () => {
      const userId = '123';
      const serviceResult = {
        status: 200,
        data: { contacts: [{ contact_id: 1, user_id: 123 }] },
      };

      contactsService.getContacts.mockResolvedValue(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      const promises = Array.from({ length: 50 }).map(() =>
        controller.getContacts(userId, res as Response),
      );

      await Promise.all(promises);

      expect(contactsService.getContacts).toHaveBeenCalledTimes(50);
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  // Simulate unauthorized access (assuming logic handled in service later)
  describe('Unauthorized Access', () => {
    it('should handle unauthorized user access for contact ID', async () => {
      const id = '999';
      const serviceResult = {
        status: 403,
        data: { error: 'Unauthorized access' },
      };

      contactsService.getContacts.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.getContacts(id, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });
  });
});
