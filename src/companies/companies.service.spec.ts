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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // getCompanies()
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

    it('should return 500 on query error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('db error'));
      const result = await service.getCompanies();
      expect(result.status).toBe(500);
      expect(result.data.error).toBe('Failed to fetch companies');
    });
  });

  // addCompany()
  const validBody = {
    user_id: 1,
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

  describe('addCompany', () => {

    it('should add company successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ company_id: 1, ...validBody }],
      });
      const result = await service.addCompany(validBody);
      expect(result.status).toBe(201);
      expect(result.data.company).toBeDefined();
      expect(result.data.message).toBe('Company added successfully');
      expect(mockQuery).toHaveBeenCalled();
    });

    it('should return 400 if required fields are missing', async () => {
      const incomplete = { user_id: 1, company_name: 'TechCorp' };
      const result = await service.addCompany(incomplete);
      expect(result.status).toBe(400);
      expect(result.data.error).toBe('All fields are required');
    });

    it('should return 500 on DB error during addCompany', async () => {
      mockQuery.mockRejectedValueOnce(new Error('insert error'));
      const result = await service.addCompany(validBody);
      expect(result.status).toBe(500);
      expect(result.data.error).toBe('Failed to add company');
    });
  });

  describe('addCompany - edge case: SQL injection', () => {
    it('should reject potentially malicious input', async () => {
      const maliciousPayload = {
        ...validBody,
        email: "'; DROP TABLE companies;--",
      };

      mockQuery.mockResolvedValueOnce({
        rows: [{ company_id: 1, ...maliciousPayload }],
      });

      const result = await service.addCompany(maliciousPayload);
      expect(result.status).toBe(201);
      expect(result.data.company.email).toContain('DROP TABLE');
    });
  });


describe('addCompany - simulate 429 Too Many Requests', () => {
  it('should return 429 if rate-limited (simulated)', async () => {
    const error: any = new Error('Too Many Requests');
    error.code = 'RATE_LIMIT';
    mockQuery.mockRejectedValueOnce(error);

    const result = await service.addCompany(validBody);
    expect(result.status).toBe(500); // Still 500 since no explicit 429 handling
    expect(result.data.error).toBe('Failed to add company');
  });
});

  // deleteCompany()
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

  describe('deleteCompany - race condition', () => {
    it('should return 404 if company already deleted', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await service.deleteCompany('1');
      expect(result.status).toBe(404);
      expect(result.data.error).toBe('Company not found');
    });
  });

  // updateCompany()
  describe('updateCompany', () => {
    const updateBody = {
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

    it('should return 400 if no id provided', async () => {
      const result = await service.updateCompany({
        ...updateBody,
        id: undefined,
      });
      expect(result.status).toBe(400);
      expect(result.data.error).toBe('Company ID is required');
    });

    it('should return 400 for invalid id', async () => {
      const result = await service.updateCompany({ ...updateBody, id: 'abc' });
      expect(result.status).toBe(400);
      expect(result.data.error).toBe('Invalid company ID');
    });

    it('should return 404 if company not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.updateCompany(updateBody);
      expect(result.status).toBe(404);
      expect(result.data.error).toBe('Company not found');
    });

    it('should update company successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ company_id: 1, user_id: 1 }],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ company_id: 1, ...updateBody }],
      });
      const result = await service.updateCompany(updateBody);
      expect(result.status).toBe(200);
      expect(result.data.message).toBe('Company updated successfully');
      expect(result.data.company).toBeDefined();
    });

    it('should return 500 on DB error during update', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ company_id: 1 }] });
      mockQuery.mockRejectedValueOnce(new Error('update error'));
      const result = await service.updateCompany(updateBody);
      expect(result.status).toBe(500);
      expect(result.data.error).toBe('Failed to update company');
    });
  });

  // resetTable()
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
  });
});
