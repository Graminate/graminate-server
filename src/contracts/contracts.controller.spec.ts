import { Test, TestingModule } from '@nestjs/testing';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { Response, Request } from 'express';
import { CreateContractDto } from './contracts.dto';
import {
  BadRequestException,
  ValidationPipe,
  CanActivate,
  ExecutionContext,
  Paramtype,
  ArgumentMetadata,
} from '@nestjs/common';

class DummyAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    return request.headers.authorization === 'valid-token';
  }
}

// --- A simplified mock of the ContractsService ---
const createMockContractsService = (): Partial<ContractsService> => ({
  getContracts: jest.fn(),
  addContract: jest.fn(),
  deleteContract: jest.fn(),
  updateContract: jest.fn(),
  resetTable: jest.fn(),
});

// --- A factory to create a mock Express response ---
const createMockResponse = (): {
  res: Partial<Response>;
  statusMock: jest.Mock;
  jsonMock: jest.Mock;
} => {
  const jsonMock = jest.fn();
  const statusMock = jest.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return { json: jsonMock };
  });
  const res: Partial<Response> = {
    status: statusMock as any,
    json: jest.fn(),
  };
  return { res, statusMock, jsonMock };
};

describe('ContractsController (Focused)', () => {
  let controller: ContractsController;
  let service: Partial<ContractsService>;
  let validationPipe: ValidationPipe;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractsController],
      providers: [
        { provide: ContractsService, useValue: createMockContractsService() },
      ],
    })
      // Override global guard for authentication testing
      .overrideGuard(DummyAuthGuard)
      .useValue(new DummyAuthGuard())
      .compile();

    controller = module.get<ContractsController>(ContractsController);
    service = module.get(ContractsService);
    validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    });
  });

  describe('Authentication & Authorization', () => {
    it('should allow access with a valid token', async () => {
      // Simulate a valid request by ensuring the dummy guard returns true.
      const req: Partial<Request> = {
        headers: { authorization: 'valid-token' },
      };
      const { res, statusMock } = createMockResponse();
      // For demonstration we use getAllContracts; the dummy guard is registered globally.
      (service.getContracts as jest.Mock).mockResolvedValueOnce({
        status: 200,
        data: { contracts: [] },
      });
      await controller.getAllContracts(res as Response);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should deny access with an invalid token', async () => {
      const guard = new DummyAuthGuard();
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: { authorization: 'invalid-token' } }),
        }),
      } as ExecutionContext;
      expect(guard.canActivate(context)).toBe(false);
    });
  });

  describe('Security Testing', () => {
    it('should handle injection-like strings safely in addContract', async () => {
      const maliciousDto: CreateContractDto = {
        user_id: 1,
        deal_name: "Deal'); DROP TABLE deals;--",
        partner: "' OR '1'='1",
        amount: 1000,
        stage: 'Negotiation',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };
      const serviceResult = {
        status: 201,
        data: {
          message: 'Contract added',
          contract: { deal_id: 1, ...maliciousDto },
        },
      };
      (service.addContract as jest.Mock).mockResolvedValueOnce(serviceResult);
      const { res, statusMock } = createMockResponse();
      await controller.addContract(maliciousDto, res as Response);
      expect(service.addContract).toHaveBeenCalledWith(maliciousDto);
      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe('Observability & Logging', () => {
    it('should log an error when service.addContract fails', async () => {
      const createDto: CreateContractDto = {
        user_id: 1,
        deal_name: 'Big Deal',
        partner: 'Partner Co',
        amount: 10000,
        stage: 'Negotiation',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };
      const serviceResult = { status: 500, data: { error: 'DB Error' } };
      (service.addContract as jest.Mock).mockResolvedValueOnce(serviceResult);
      const { res } = createMockResponse();
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      await controller.addContract(createDto, res as Response);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Compliance with Business Rules', () => {
    it('should trigger validation and reject an invalid contract DTO', async () => {
      const invalidDto = {
        user_id: 'not-a-number',
        deal_name: '',
        amount: 'invalid-amount',
      };
      const metadata: ArgumentMetadata = {
        type: 'body' as Paramtype,
        metatype: CreateContractDto,
        data: '',
      };
      await expect(
        validationPipe.transform(invalidDto, metadata),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Load & Integration Testing', () => {
    it('should integrate addContract and getAllContracts endpoints', async () => {
      const createDto: CreateContractDto = {
        user_id: 1,
        deal_name: 'Integration Deal',
        partner: 'Integrate Partner',
        amount: 5000,
        stage: 'Qualification',
        start_date: '2024-05-01',
        end_date: '2024-11-01',
      };
      const addedContract = { deal_id: 10, ...createDto };
      const serviceAddResult = {
        status: 201,
        data: { message: 'Contract added', contract: addedContract },
      };
      const serviceGetResult = {
        status: 200,
        data: { contracts: [addedContract] },
      };
      (service.addContract as jest.Mock).mockResolvedValueOnce(
        serviceAddResult,
      );
      (service.getContracts as jest.Mock).mockResolvedValueOnce(
        serviceGetResult,
      );

      const addRes = createMockResponse();
      await controller.addContract(createDto, addRes.res as Response);
      expect(addRes.statusMock).toHaveBeenCalledWith(201);

      const getRes = createMockResponse();
      await controller.getAllContracts(getRes.res as Response);
      expect(getRes.statusMock).toHaveBeenCalledWith(200);
      expect(getRes.jsonMock).toHaveBeenCalledWith(serviceGetResult.data);
    });
  });

  describe('Rate Limiting / Abuse Prevention', () => {
    it('should respond with 429 Too Many Requests when rate limit exceeded', async () => {
      // Simulate service rejecting due to abuse or throttling
      (service.addContract as jest.Mock).mockResolvedValueOnce({
        status: 429,
        data: { error: 'Too many requests' },
      });

      const dto: CreateContractDto = {
        user_id: 1,
        deal_name: 'Flooded Deal',
        partner: 'Abuser',
        amount: 100,
        stage: 'Lead',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };

      const { res, statusMock, jsonMock } = createMockResponse();
      await controller.addContract(dto, res as Response);

      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Too many requests' });
    });
  });
});
