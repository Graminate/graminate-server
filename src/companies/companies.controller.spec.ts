import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Response } from 'express';
import { CreateCompanyDto } from './companies.dto';

type MockCompaniesService = { [K in keyof CompaniesService]: jest.Mock };

const createMockCompaniesService = (): MockCompaniesService => ({
  getCompanies: jest.fn(),
  addCompany: jest.fn(),
  deleteCompany: jest.fn(),
  updateCompany: jest.fn(),
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

describe('CompaniesController', () => {
  let controller: CompaniesController;
  let companiesService: MockCompaniesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [
        { provide: CompaniesService, useValue: createMockCompaniesService() },
      ],
    }).compile();

    controller = module.get<CompaniesController>(CompaniesController);
    companiesService = module.get(CompaniesService);
  });

  // GET /api/companies/:id and rate limiting
  describe('GET /api/companies/:id', () => {
    it('should return companies for given user id', async () => {
      const id = '123';
      const resultData = { companies: [{ company_id: 1, user_id: 123 }] };
      const serviceResult = { status: 200, data: resultData };
      companiesService.getCompanies.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.getCompanies(id, res as Response);

      expect(companiesService.getCompanies).toHaveBeenCalledWith(id);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(resultData);
    });

    it('should return error for invalid user id', async () => {
      const id = 'abc';
      const serviceResult = {
        status: 400,
        data: { error: 'Invalid user ID parameter' },
      };
      companiesService.getCompanies.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.getCompanies(id, res as Response);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('should handle rate limiting error', async () => {
      const id = '1';
      const serviceResult = {
        status: 429,
        data: { error: 'Too many requests. Please try again later.' },
      };
      companiesService.getCompanies.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.getCompanies(id, res as Response);
      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });
  });

  // GET /api/companies with pagination
  describe('GET /api/companies with pagination', () => {
    it('should return paginated companies when limit and offset provided', async () => {
      const resultData = {
        companies: Array(10).fill({ company_id: 1, user_id: 123 }),
      };
      const serviceResult = { status: 200, data: resultData };
      companiesService.getCompanies.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.getAllCompanies(res as Response, '10', '0');

      expect(companiesService.getCompanies).toHaveBeenCalledWith(
        undefined,
        10,
        0,
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(resultData);
    });

    it('should return all companies when no pagination params provided', async () => {
      const resultData = { companies: [{ company_id: 1, user_id: 123 }] };
      const serviceResult = { status: 200, data: resultData };
      companiesService.getCompanies.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();

      const limit: string | undefined = undefined;
      const offset: string | undefined = undefined;
      await controller.getAllCompanies(res as Response, limit, offset);

      expect(companiesService.getCompanies).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(resultData);
    });
  });

  // POST /api/companies/add and security tests
  describe('POST /api/companies/add', () => {
    const validDto: CreateCompanyDto = {
      user_id: 123,
      company_name: 'TechCorp',
      owner_name: 'Alice',
      email: 'alice@techcorp.com',
      phone_number: '+12345678901',
      type: 'IT',
      address_line_1: '123 Tech Street',
      address_line_2: 'Suite 100',
      city: 'Tech City',
      state: 'Tech State',
      postal_code: '123456',
    };

    it('should add a company successfully', async () => {
      const serviceResult = {
        status: 201,
        data: {
          message: 'Company added successfully',
          company: { company_id: 1, ...validDto },
        },
      };
      companiesService.addCompany.mockResolvedValueOnce(serviceResult);
      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.addCompany(validDto, res as Response);

      expect(companiesService.addCompany).toHaveBeenCalledWith(validDto);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('should return error for missing required fields', async () => {
      const incompleteDto: any = { user_id: 123, company_name: 'TechCorp' };
      const serviceResult = {
        status: 400,
        data: { error: 'All fields are required' },
      };
      companiesService.addCompany.mockResolvedValueOnce(serviceResult);
      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.addCompany(incompleteDto, res as Response);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('should return 401 for unauthorized access (simulated)', async () => {
      const serviceResult = {
        status: 401,
        data: { error: 'Unauthorized access' },
      };
      companiesService.addCompany.mockResolvedValueOnce(serviceResult);
      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.addCompany(validDto, res as Response);
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized access' });
    });

    it('should not crash on SQL injection attempt', async () => {
      const maliciousDto: CreateCompanyDto = {
        ...validDto,
        email: "'; DROP TABLE companies;--",
      };
      const serviceResult = {
        status: 201,
        data: {
          message: 'Company added successfully',
          company: { company_id: 1, ...maliciousDto },
        },
      };
      companiesService.addCompany.mockResolvedValueOnce(serviceResult);
      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.addCompany(maliciousDto, res as Response);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });
  });

  // DELETE /api/companies/delete/:id
  describe('DELETE /api/companies/delete/:id', () => {
    it('should delete a company successfully', async () => {
      const serviceResult = {
        status: 200,
        data: {
          message: 'Company deleted successfully',
          company: { company_id: 1 },
        },
      };
      companiesService.deleteCompany.mockResolvedValueOnce(serviceResult);
      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.deleteCompany('1', res as Response);

      expect(companiesService.deleteCompany).toHaveBeenCalledWith('1');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('should return error for invalid id', async () => {
      const serviceResult = {
        status: 400,
        data: { error: 'Invalid company ID' },
      };
      companiesService.deleteCompany.mockResolvedValueOnce(serviceResult);
      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.deleteCompany('invalid', res as Response);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });
  });

  // PUT /api/companies/update
  describe('PUT /api/companies/update', () => {
    const updateData = {
      id: '1',
      company_name: 'NewTechCorp',
      owner_name: 'Bob',
      email: 'bob@newtechcorp.com',
      phone_number: '+19876543210',
      type: 'Technology',
      address_line_1: '456 New Tech Ave',
      address_line_2: 'Floor 2',
      city: 'Innovation City',
      state: 'Innovation State',
      postal_code: '543210',
    };

    it('should update a company successfully', async () => {
      const serviceResult = {
        status: 200,
        data: {
          message: 'Company updated successfully',
          company: { company_id: 1, ...updateData },
        },
      };
      companiesService.updateCompany.mockResolvedValueOnce(serviceResult);
      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.updateCompany(updateData, res as Response);
      expect(companiesService.updateCompany).toHaveBeenCalledWith(updateData);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('should return error for invalid id in update', async () => {
      const badUpdate = { ...updateData, id: 'abc' };
      const serviceResult = {
        status: 400,
        data: { error: 'Invalid company ID' },
      };
      companiesService.updateCompany.mockResolvedValueOnce(serviceResult);
      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.updateCompany(badUpdate, res as Response);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('should return 403 for unauthorized update attempts', async () => {
      const maliciousUpdate = { ...updateData, id: '2' };
      const serviceResult = {
        status: 403,
        data: { error: "Forbidden: Cannot update another user's company" },
      };
      companiesService.updateCompany.mockResolvedValueOnce(serviceResult);
      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.updateCompany(maliciousUpdate, res as Response);
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('should return conflict on concurrent update', async () => {
      const serviceResult = {
        status: 409,
        data: { error: 'Conflict: Company was updated by another process' },
      };
      companiesService.updateCompany.mockResolvedValueOnce(serviceResult);
      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.updateCompany(updateData, res as Response);
      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });
  });

  // POST /api/companies/reset
  describe('POST /api/companies/reset', () => {
    it('should reset companies table successfully', async () => {
      const serviceResult = { message: 'Companies table reset for user 123' };
      companiesService.resetTable.mockResolvedValueOnce(serviceResult);
      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.reset(123, res as Response);
      expect(companiesService.resetTable).toHaveBeenCalledWith(123);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult);
    });

    it('should return error on reset failure', async () => {
      companiesService.resetTable.mockRejectedValueOnce(
        new Error('truncate error'),
      );
      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.reset(123, res as Response);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to reset companies table',
      });
    });
  });
});
