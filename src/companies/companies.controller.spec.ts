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
        {
          provide: CompaniesService,
          useValue: createMockCompaniesService(),
        },
      ],
    }).compile();

    controller = module.get<CompaniesController>(CompaniesController);
    companiesService = module.get(CompaniesService);
  });

  // GET /api/companies/:id
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

    it('should return error for invalid id', async () => {
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
  });

  // GET /api/companies
  describe('GET /api/companies', () => {
    it('should return all companies when no id provided', async () => {
      const resultData = { companies: [{ company_id: 1, user_id: 123 }] };
      const serviceResult = { status: 200, data: resultData };
      companiesService.getCompanies.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.getAllCompanies(res as Response);

      expect(companiesService.getCompanies).toHaveBeenCalledWith();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(resultData);
    });
  });

  // POST /api/companies/add
  describe('POST /api/companies/add', () => {
    it('should add a company successfully', async () => {
      const createCompanyDto: CreateCompanyDto = {
        user_id: 123,
        company_name: 'TechCorp',
        owner_name: 'Alice',
        email: 'alice@techcorp.com',
        phone_number: '+1234567890',
        type: 'IT',
        address_line_1: '123 Tech Street',
        address_line_2: 'Suite 100',
        city: 'Tech City',
        state: 'Tech State',
        postal_code: '12345',
      };
      const serviceResult = {
        status: 201,
        data: {
          message: 'Company added successfully',
          company: { id: 1, ...createCompanyDto },
        },
      };
      companiesService.addCompany.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.addCompany(createCompanyDto, res as Response);

      expect(companiesService.addCompany).toHaveBeenCalledWith(
        createCompanyDto,
      );
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

      expect(companiesService.addCompany).toHaveBeenCalledWith(incompleteDto);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });
  });

  // DELETE /api/companies/delete/:id
  describe('DELETE /api/companies/delete/:id', () => {
    it('should delete a company successfully', async () => {
      const id = '1';
      const serviceResult = {
        status: 200,
        data: {
          message: 'Company deleted successfully',
          company: { company_id: 1 },
        },
      };
      companiesService.deleteCompany.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.deleteCompany(id, res as Response);

      expect(companiesService.deleteCompany).toHaveBeenCalledWith(id);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('should return error if id is invalid', async () => {
      const id = 'invalid';
      const serviceResult = {
        status: 400,
        data: { error: 'Invalid company ID' },
      };
      companiesService.deleteCompany.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.deleteCompany(id, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });
  });

  describe('DELETE /api/companies/delete/:id - unauthorized simulation', () => {
    it('should return 403 if user is not authorized to delete', async () => {
      const id = '1';
      const serviceResult = {
        status: 403,
        data: { error: 'You are not authorized to delete this company' },
      };
      companiesService.deleteCompany.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.deleteCompany(id, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });
  });

  // PUT /api/companies/update
  describe('PUT /api/companies/update', () => {
    it('should update a company successfully', async () => {
      const updateData = {
        id: '1',
        company_name: 'NewTechCorp',
        owner_name: 'Bob',
        email: 'bob@newtechcorp.com',
        phone_number: '+0987654321',
        type: 'Technology',
        address_line_1: '456 New Tech Ave',
        address_line_2: 'Floor 2',
        city: 'Innovation City',
        state: 'Innovation State',
        postal_code: '54321',
      };
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

    it('should return error if update data is invalid', async () => {
      const updateData = { id: 'invalid', company_name: 'NewTechCorp' };
      const serviceResult = {
        status: 400,
        data: { error: 'Invalid company ID' },
      };
      companiesService.updateCompany.mockResolvedValueOnce(serviceResult);

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.updateCompany(updateData, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });
  });

  // POST /api/companies/reset
  describe('POST /api/companies/reset', () => {
    it('should reset companies table', async () => {
      const userId = 123;
      const serviceResult = {
        message: `Companies table reset for user ${userId}`,
      };
      companiesService.resetTable.mockResolvedValueOnce(serviceResult);

      const result = await controller.reset(userId);
      expect(companiesService.resetTable).toHaveBeenCalledWith(userId);
      expect(result).toEqual(serviceResult);
    });
  });

  describe('POST /api/companies/add - SQL injection attempt', () => {
      const createMockCompany = () => ({
        user_id: 123,
        company_name: 'TechCorp',
        owner_name: 'Alice',
        email: 'alice@techcorp.com',
        phone_number: '+1234567890',
        type: 'IT',
        address_line_1: '123 Tech Street',
        address_line_2: 'Suite 100',
        city: 'Tech City',
        state: 'Tech State',
        postal_code: '12345',
      });
  
      it('should not crash with malicious input', async () => {
        const maliciousDto = {
          ...createMockCompany(),
          email: "'; DROP TABLE companies;--",
        };
        const serviceResult = {
          status: 201,
          data: { message: 'Company added successfully', company: maliciousDto },
        };
        companiesService.addCompany.mockResolvedValueOnce(serviceResult);
  
        const { res, statusMock, jsonMock } = createMockResponse();
        await controller.addCompany(maliciousDto, res as Response);
  
        expect(statusMock).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
      });
    });
});
