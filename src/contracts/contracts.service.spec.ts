import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';
import pool from '@/config/database';
import { CreateContractDto, UpdateContractDto } from './contracts.dto';

jest.mock('@/config/database', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

describe('ContractsService (Focused)', () => {
  let service: ContractsService;
  let mockQuery: jest.Mock;

  // A sample contract for testing
  const mockContract = {
    deal_id: 1,
    user_id: 123,
    deal_name: 'Test Deal',
    partner: 'Test Partner',
    amount: 5000,
    stage: 'Prospecting',
    start_date: '2024-01-15T00:00:00.000Z',
    end_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const createDto: CreateContractDto = {
    user_id: 123,
    deal_name: 'New Deal',
    partner: 'New Partner Co',
    amount: 15000,
    stage: 'Qualification',
    start_date: '2024-02-01',
    end_date: '2024-11-30',
  };

  beforeEach(async () => {
    mockQuery = pool.query as jest.Mock;
    mockQuery.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ContractsService],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
  });

  describe('Compliance with Business Rules', () => {
    it('should reject getContracts with an invalid user_id', async () => {
      const result = await service.getContracts(0);
      expect(result.status).toBe(400);
      expect(result.data.error).toBe('Invalid User ID parameter');
    });

    it('should successfully add a valid contract', async () => {
      const newContract = { deal_id: 2, ...createDto };
      mockQuery.mockResolvedValueOnce({ rows: [newContract] });
      const result = await service.addContract(createDto);
      expect(result.status).toBe(201);
      expect(result.data.contract).toEqual(newContract);
    });
  });

  describe('Security Testing', () => {
    it('should handle potential injection-like strings safely in addContract', async () => {
      const maliciousDto: CreateContractDto = {
        user_id: 1,
        deal_name: "Deal'); DROP TABLE deals;--",
        partner: "' OR '1'='1",
        amount: 1000,
        stage: 'Negotiation',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };
      const expectedContract = { deal_id: 3, ...maliciousDto };
      mockQuery.mockResolvedValueOnce({ rows: [expectedContract] });
      const result = await service.addContract(maliciousDto);
      expect(result.status).toBe(201);
      expect(result.data.contract.deal_name).toBe(maliciousDto.deal_name);
      expect(result.data.contract.partner).toBe(maliciousDto.partner);
    });
  });

  describe('Observability & Logging', () => {
    it('should log an error and return 500 when the database query fails in getContracts', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockQuery.mockRejectedValueOnce(new Error('DB Connection Error'));
      const result = await service.getContracts(123);
      expect(result.status).toBe(500);
      expect(result.data.error).toBe('Failed to fetch contracts');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Load & Integration Testing', () => {
    it('should integrate addContract and then getContracts for the same user', async () => {
      const newContract = { deal_id: 5, ...createDto };
      // Simulate adding the contract
      mockQuery.mockResolvedValueOnce({ rows: [newContract] });
      const addResult = await service.addContract(createDto);
      expect(addResult.status).toBe(201);

      // Simulate retrieving the contracts
      mockQuery.mockResolvedValueOnce({ rows: [newContract] });
      const getResult = await service.getContracts(createDto.user_id);
      expect(getResult.status).toBe(200);
      expect(getResult.data.contracts).toEqual([newContract]);
    });
  });

  describe('Race Conditions / Concurrent Updates', () => {
    it('should return 404 if contract disappears between existence check and update', async () => {
      const updateDto: UpdateContractDto = {
        id: 1,
        deal_name: 'Race Deal',
      };

      // Contract exists at first
      mockQuery.mockResolvedValueOnce({ rows: [{ deal_id: 1 }] });
      // But disappears before update executes
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await service.updateContract(updateDto);
      expect(result.status).toBe(404);
      expect(result.data.error).toBe('Contract not found or failed to update');
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe('Pagination / Filtering Logic', () => {
    it('should apply limit and offset when page and limit are provided', async () => {
      const expectedContracts = [mockContract, { ...mockContract, deal_id: 2 }];
      mockQuery.mockResolvedValueOnce({ rows: expectedContracts });

      const result = await service.getContracts(undefined, 2, 10); // page 2, limit 10
      expect(result.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 10 OFFSET 10'),
        [],
      );
      expect(result.data.contracts).toEqual(expectedContracts);
    });
  });
});
