import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';

type MockUserService = { [K in keyof UserService]: jest.Mock };

const createMockUserService = (): MockUserService => ({
  validateSession: jest.fn(),
  getUserById: jest.fn(),
  updateUser: jest.fn(),
  loginUser: jest.fn(),
  logoutUser: jest.fn(),
  registerUser: jest.fn(),
  deleteUser: jest.fn(),
  getUserTypeById: jest.fn(),
  verifyPassword: jest.fn(),
});

const createMockRequest = (
  cookies?: Record<string, string>,
  body?: any,
  params?: any,
): Partial<Request> => ({
  cookies: cookies || {},
  body: body || {},
  params: params || {},
});

const createMockResponse = () => {
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

describe('UserController', () => {
  let controller: UserController;
  let userService: MockUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: createMockUserService() }],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUser', () => {
    const userId = '123';
    const sessionId = 'session-abc';
    const mockReq = createMockRequest({ sid: sessionId }, null, { id: userId });
    const { res, statusMock, jsonMock } = createMockResponse();
    const serviceResult = {
      status: 200,
      data: { user: { id: userId, name: 'Test' } },
    };

    it('returns user data if authorized', async () => {
      userService.validateSession.mockResolvedValueOnce(true);
      userService.getUserById.mockResolvedValueOnce(serviceResult);

      await controller.getUser(userId, mockReq as Request, res as Response);

      expect(userService.validateSession).toHaveBeenCalledWith(
        sessionId,
        userId,
      );
      expect(userService.getUserById).toHaveBeenCalledWith(userId);
      expect(statusMock).toHaveBeenCalledWith(serviceResult.status);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('throws UnauthorizedException if not authorized', async () => {
      userService.validateSession.mockResolvedValueOnce(false);

      await expect(
        controller.getUser(userId, mockReq as Request, res as Response),
      ).rejects.toThrow(UnauthorizedException);

      expect(userService.validateSession).toHaveBeenCalledWith(
        sessionId,
        userId,
      );
      expect(userService.getUserById).not.toHaveBeenCalled();
    });
  });

  describe('getUserType', () => {
    const userId = 'user-456';
    const { res, statusMock, jsonMock } = createMockResponse();
    const serviceResult = { status: 200, data: { type: 'Producer' } };

    it('returns user type', async () => {
      userService.getUserTypeById.mockResolvedValueOnce(serviceResult);

      await controller.getUserType(userId, res as Response);

      expect(userService.getUserTypeById).toHaveBeenCalledWith(userId);
      expect(statusMock).toHaveBeenCalledWith(serviceResult.status);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });
  });

  describe('updateUser', () => {
    const userId = '123';
    const sessionId = 'session-abc';
    const updateBody = { first_name: 'Updated' };
    const mockReq = createMockRequest({ sid: sessionId }, updateBody, {
      id: userId,
    });
    const { res, statusMock, jsonMock } = createMockResponse();
    const serviceResult = { status: 200, data: { message: 'User updated' } };

    it('updates user data if authorized', async () => {
      userService.validateSession.mockResolvedValueOnce(true);
      userService.updateUser.mockResolvedValueOnce(serviceResult);

      await controller.updateUser(
        userId,
        updateBody,
        mockReq as Request,
        res as Response,
      );

      expect(userService.validateSession).toHaveBeenCalledWith(
        sessionId,
        userId,
      );
      expect(userService.updateUser).toHaveBeenCalledWith(userId, updateBody);
      expect(statusMock).toHaveBeenCalledWith(serviceResult.status);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('throws UnauthorizedException if not authorized', async () => {
      userService.validateSession.mockResolvedValueOnce(false);

      await expect(
        controller.updateUser(
          userId,
          updateBody,
          mockReq as Request,
          res as Response,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(userService.validateSession).toHaveBeenCalledWith(
        sessionId,
        userId,
      );
      expect(userService.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginBody = { email: 'test@example.com', password: 'password' };
    const { res, statusMock, jsonMock } = createMockResponse();
    const serviceResult = {
      status: 200,
      data: { message: 'Login successful', user: { id: '1' } },
    };

    it('logs in user and returns result', async () => {
      userService.loginUser.mockResolvedValueOnce(serviceResult);

      await controller.login(loginBody, res as Response);

      expect(userService.loginUser).toHaveBeenCalledWith(loginBody, res);
      expect(statusMock).toHaveBeenCalledWith(serviceResult.status);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('returns 401 for invalid credentials', async () => {
      const loginBody = { email: 'wrong@example.com', password: 'wrongpass' };
      const serviceResult = {
        status: 401,
        data: { error: 'Invalid email or password.' },
      };
      userService.loginUser.mockResolvedValueOnce(serviceResult);

      await controller.login(loginBody, res as Response);

      expect(userService.loginUser).toHaveBeenCalledWith(loginBody, res);
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('returns 400 if email is missing', async () => {
      const loginBody = { password: 'pass' };
      const serviceResult = {
        status: 400,
        data: { error: 'Email and password are required.' },
      };
      userService.loginUser.mockResolvedValueOnce(serviceResult);

      await controller.login(loginBody, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });
  });

  describe('logout', () => {
    const sessionId = 'session-abc';
    const mockReq = createMockRequest({ sid: sessionId });
    const { res, statusMock, jsonMock } = createMockResponse();
    const serviceResult = {
      status: 200,
      data: { message: 'Logout successful' },
    };

    it('logs out user with session ID', async () => {
      userService.logoutUser.mockResolvedValueOnce(serviceResult);

      await controller.logout(mockReq as Request, res as Response);

      expect(userService.logoutUser).toHaveBeenCalledWith(sessionId, res);
      expect(statusMock).toHaveBeenCalledWith(serviceResult.status);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('logs out user with undefined if no session cookie', async () => {
      const reqNoCookie = createMockRequest({});
      userService.logoutUser.mockResolvedValueOnce(serviceResult);

      await controller.logout(reqNoCookie as Request, res as Response);

      expect(userService.logoutUser).toHaveBeenCalledWith(undefined, res);
      expect(statusMock).toHaveBeenCalledWith(serviceResult.status);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });
  });

  describe('register', () => {
    const registerBody = {
      first_name: 'New',
      email: 'new@test.com',
      password: 'abc',
    };
    const { res, statusMock, jsonMock } = createMockResponse();
    const serviceResult = {
      status: 201,
      data: { message: 'User registered', user: { id: '2' } },
    };

    it('registers new user', async () => {
      userService.registerUser.mockResolvedValueOnce(serviceResult);

      await controller.register(registerBody, res as Response);

      expect(userService.registerUser).toHaveBeenCalledWith(registerBody);
      expect(statusMock).toHaveBeenCalledWith(serviceResult.status);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('returns 409 if user already exists', async () => {
      const registerBody = {
        first_name: 'Existing',
        last_name: 'User',
        email: 'existing@test.com',
        phone_number: '1234567890',
        password: 'pass',
      };
      const serviceResult = {
        status: 409,
        data: { error: 'Email or phone number already in use' },
      };

      userService.registerUser.mockResolvedValueOnce(serviceResult);

      await controller.register(registerBody, res as Response);

      expect(userService.registerUser).toHaveBeenCalledWith(registerBody);
      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });
  });

  describe('deleteUser', () => {
    const userId = '123';
    const sessionId = 'session-xyz';
    const mockReq = createMockRequest({ sid: sessionId }, null, { id: userId });
    const { res, statusMock, jsonMock } = createMockResponse();
    const serviceResult = { status: 200, data: { message: 'User deleted' } };

    it('deletes user if authorized', async () => {
      userService.validateSession.mockResolvedValueOnce(true);
      userService.deleteUser.mockResolvedValueOnce(serviceResult);

      await controller.deleteUser(userId, mockReq as Request, res as Response);

      expect(userService.validateSession).toHaveBeenCalledWith(
        sessionId,
        userId,
      );
      expect(userService.deleteUser).toHaveBeenCalledWith(
        userId,
        sessionId,
        res,
      );
      expect(statusMock).toHaveBeenCalledWith(serviceResult.status);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('throws UnauthorizedException if not authorized', async () => {
      userService.validateSession.mockResolvedValueOnce(false);

      await expect(
        controller.deleteUser(userId, mockReq as Request, res as Response),
      ).rejects.toThrow(UnauthorizedException);

      expect(userService.validateSession).toHaveBeenCalledWith(
        sessionId,
        userId,
      );
      expect(userService.deleteUser).not.toHaveBeenCalled();
    });
  });

  describe('verifyPassword', () => {
    const userId = '123';
    const password = 'password-to-check';
    const sessionId = 'session-def';
    const mockReq = createMockRequest(
      { sid: sessionId },
      { password },
      { id: userId },
    );
    const { res, statusMock, jsonMock } = createMockResponse();
    const serviceResult = { status: 200, data: { valid: true } };

    it('verifies password if authorized', async () => {
      userService.validateSession.mockResolvedValueOnce(true);
      userService.verifyPassword.mockResolvedValueOnce(serviceResult);

      await controller.verifyPassword(
        userId,
        password,
        mockReq as Request,
        res as Response,
      );

      expect(userService.validateSession).toHaveBeenCalledWith(
        sessionId,
        userId,
      );
      expect(userService.verifyPassword).toHaveBeenCalledWith(userId, password);
      expect(statusMock).toHaveBeenCalledWith(serviceResult.status);
      expect(jsonMock).toHaveBeenCalledWith(serviceResult.data);
    });

    it('throws UnauthorizedException if not authorized', async () => {
      userService.validateSession.mockResolvedValueOnce(false);

      await expect(
        controller.verifyPassword(
          userId,
          password,
          mockReq as Request,
          res as Response,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(userService.validateSession).toHaveBeenCalledWith(
        sessionId,
        userId,
      );
      expect(userService.verifyPassword).not.toHaveBeenCalled();
    });
  });
});
