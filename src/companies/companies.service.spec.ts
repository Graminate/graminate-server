import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import pool from '@/config/database';
import { InternalServerErrorException } from '@nestjs/common';

jest.mock('@/config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('CompaniesService', () => {
  let service: CompaniesService;
  const mockQuery = pool.query as jest.Mock;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompaniesService],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    mockQuery.mockReset();
  });

  describe('getCompanies', () => {
    it('should return all companies when no id provided', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ company_id: 1, user_id: 123 }],
      });
      const result = await service.getCompanies();
      expect(result.status).toBe(200);
      expect(result.data.companies).toHaveLength(1);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM companies ORDER BY created_at DESC',
        [],
      );
    });

    it('should return companies for a valid id', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ company_id: 2, user_id: 456 }],
      });
      const result = await service.getCompanies('456');
      expect(result.status).toBe(200);
      expect(result.data.companies).toHaveLength(1);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM companies WHERE user_id = $1 ORDER BY created_at DESC',
        [456],
      );
    });

    it('should return 400 for invalid id', async () => {
      const result = await service.getCompanies('abc');
      expect(result.status).toBe(400);
      expect(result.data.error).toBe('Invalid user ID parameter');
    });

    it('should return paginated companies when limit and offset provided', async () => {
      const limit = 10;
      const offset = 0;
      const companiesList = Array.from({ length: limit }, (_, i) => ({
        company_id: i + 1,
        user_id: 1,
      }));
      mockQuery.mockResolvedValueOnce({ rows: companiesList });
      const result = await service.getCompanies(undefined, limit, offset);
      expect(result.status).toBe(200);
      expect(result.data.companies).toHaveLength(limit);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM companies ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset],
      );
    });

    it('should return 500 on query error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('db error'));
      const result = await service.getCompanies();
      expect(result.status).toBe(500);
      expect(result.data.error).toBe('Failed to fetch companies');
    });

    it('should return 429 when rate limit exceeded', async () => {
      const error: any = new Error('Too Many Requests');
      error.code = 'RATE_LIMIT_EXCEEDED';
      mockQuery.mockRejectedValueOnce(error);
      const result = await service.getCompanies('1');
      expect(result.status).toBe(429);
      expect(result.data.error).toBe(
        'Too many requests. Please try again later.',
      );
    });
  });

  describe('addCompany', () => {
    const validBody = {
      user_id: 1,
      company_name: 'TechCorp',
      owner_name: 'Alice',
      email: 'alice@techcorp.com',
      phone_number: '+12345678901',
      type: 'IT',
      address_line_1: '123 Tech Street',
      address_line_2: 'Suite 100',
      city: 'Tech City',
      state: 'Tech State',
      postal_code: '123450',
    };

    const mockAddCompanySuccess = () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 });
      mockQuery.mockResolvedValueOnce({ rows: [{ company_id: 1 }] });
    };

    it('should add company successfully', async () => {
      mockAddCompanySuccess();
      const result = await service.addCompany(validBody);
      expect(result.status).toBe(201);
      expect(result.data.company).toBeDefined();
      expect(result.data.message).toBe('Company added successfully');
    });

    it('should return 400 if required fields are missing', async () => {
      const incomplete = { user_id: 1, company_name: 'TechCorp' };
      const result = await service.addCompany(incomplete);
      expect(result.status).toBe(400);
      expect(result.data.error).toBe('All fields are required');
    });

    it('should return 500 on DB error during addCompany', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockRejectedValueOnce(new Error('insert error'));

      const result = await service.addCompany(validBody);
      expect(result.status).toBe(500);
      expect(result.data.error).toBe('Failed to add company');
    });

    it('should validate phone_number format strictly', async () => {
      const badPhone = { ...validBody, phone_number: '1234' };
      const result = await service.addCompany(badPhone);
      expect(result.status).toBe(400);
      expect(result.data.error).toBe('Invalid phone number format');
    });

    it('should validate postal code format strictly', async () => {
      const badPostal = { ...validBody, postal_code: 'ABCDEF' };
      const result = await service.addCompany(badPostal);
      expect(result.status).toBe(400);
      expect(result.data.error).toBe('Invalid postal code format');
    });

    it('should not allow duplicate company name for the same user', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ company_id: 2, ...validBody }],
      });
      const result = await service.addCompany(validBody);
      expect(result.status).toBe(400);
      expect(result.data.error).toBe('Company with this name already exists');
    });

    it('should simulate SQL injection edge case in email', async () => {
      const maliciousPayload = {
        ...validBody,
        email: "'; DROP TABLE companies;--",
      };
      mockAddCompanySuccess();
      const result = await service.addCompany(maliciousPayload);
      expect(result.status).toBe(201);
      expect(result.data.company.email).toContain('DROP TABLE');
    });

    it('should return 429 if rate-limited during addCompany', async () => {
      const error: any = new Error('Too Many Requests');
      error.code = 'RATE_LIMIT_EXCEEDED';
      mockQuery.mockRejectedValueOnce(error);
      const result = await service.addCompany(validBody);
      expect(result.status).toBe(429);
      expect(result.data.error).toBe(
        'Too many requests. Please try again later.',
      );
    });
  });

  describe('deleteCompany', () => {
    it('should return 400 if no id provided', async () => {
      const result = await service.deleteCompany(undefined);
      expect(result.status).toBe(400);
      expect(result.data.error).toBe('Company ID is required');
    });

    it('should return 400 for invalid id', async () => {
      const result = await service.deleteCompany('abc');
      expect(result.status).toBe(400);
      expect(result.data.error).toBe('Invalid company ID');
    });

    it('should return 404 if company not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.deleteCompany('999');
      expect(result.status).toBe(404);
      expect(result.data.error).toBe('Company not found');
    });

    it('should delete company successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ company_id: 1, user_id: 1 }],
      });
      const result = await service.deleteCompany('1');
      expect(result.status).toBe(200);
      expect(result.data.message).toBe('Company deleted successfully');
    });

    it('should return 500 on DB error during deletion', async () => {
      mockQuery.mockRejectedValueOnce(new Error('db error'));
      const result = await service.deleteCompany('1');
      expect(result.status).toBe(500);
      expect(result.data.error).toBe('Failed to delete company');
    });
  });

  describe('updateCompany', () => {
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

    it('should return 400 if no id provided', async () => {
      const result = await service.updateCompany({
        ...updateData,
        id: undefined,
      });
      expect(result.status).toBe(400);
      expect(result.data.error).toBe('Company ID is required');
    });

    it('should return 400 for invalid id', async () => {
      const result = await service.updateCompany({ ...updateData, id: 'abc' });
      expect(result.status).toBe(400);
      expect(result.data.error).toBe('Invalid company ID');
    });

    it('should return 404 if company not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.updateCompany(updateData);
      expect(result.status).toBe(404);
      expect(result.data.error).toBe('Company not found');
    });

    it('should update company successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ company_id: 1, user_id: 1 }],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ company_id: 1, ...updateData }],
      });
      const result = await service.updateCompany(updateData);
      expect(result.status).toBe(200);
      expect(result.data.message).toBe('Company updated successfully');
      expect(result.data.company).toBeDefined();
    });

    it('should return conflict on concurrent update', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ company_id: 1, user_id: 1 }],
      });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.updateCompany(updateData);
      expect(result.status).toBe(409);
      expect(result.data.error).toBe(
        'Conflict: Company was updated by another process',
      );
    });

    it('should return 500 on DB error during update', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ company_id: 1 }] });
      mockQuery.mockRejectedValueOnce(new Error('update error'));
      const result = await service.updateCompany(updateData);
      expect(result.status).toBe(500);
      expect(result.data.error).toBe('Failed to update company');
    });
  });

  describe('resetTable', () => {
    it('should reset companies table successfully', async () => {
      mockQuery.mockResolvedValueOnce({});
      const result = await service.resetTable(123);
      expect(result).toEqual({ message: 'Companies table reset for user 123' });
      expect(mockQuery).toHaveBeenCalledWith(
        'TRUNCATE companies RESTART IDENTITY CASCADE',
      );
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('truncate error'));
      await expect(service.resetTable(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should log reset operation for audit trail', async () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockQuery.mockResolvedValueOnce({});
      await service.resetTable(123);
      expect(spy).toHaveBeenCalledWith(
        'Resetting companies table for user 123',
      );
    });
  });

  describe('Observability and logging', () => {
    it('should log error on DB failure in getCompanies', async () => {
      const error = new Error('Database down');
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockQuery.mockRejectedValueOnce(error);
      await service.getCompanies();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error fetching companies'),
        error,
      );
    });
  });
});
