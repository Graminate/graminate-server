import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { Response } from 'express';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { serialize } from 'cookie';
import pool from '@/config/database';

jest.mock('@/config/database', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));
jest.mock('argon2', () => ({ hash: jest.fn(), verify: jest.fn() }));
jest.mock('uuid', () => ({ v4: jest.fn() }));
jest.mock('cookie', () => ({ serialize: jest.fn() }));

const createMockResponse = (): Partial<Response> => ({
  setHeader: jest.fn().mockReturnThis(),
});

describe('UserService', () => {
  let service: UserService;
  let mockPoolQuery: jest.Mock;
  let mockArgon2Hash: jest.Mock;
  let mockArgon2Verify: jest.Mock;
  let mockUuidv4: jest.Mock;
  let mockSerialize: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
    mockPoolQuery = (pool as any).query as jest.Mock;
    mockArgon2Hash = argon2.hash as jest.Mock;
    mockArgon2Verify = argon2.verify as jest.Mock;
    mockUuidv4 = uuidv4 as jest.Mock;
    mockSerialize = serialize as jest.Mock;

    mockPoolQuery.mockClear();
    mockArgon2Hash.mockClear();
    mockArgon2Verify.mockClear();
    mockUuidv4.mockClear();
    mockSerialize.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateSession', () => {
    it('returns true for valid session and matching user ID', async () => {
      const sessionId = 'valid-session-id';
      const userId = '123';
      const sessionData = { userId: '123' };
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ sid: sessionId, sess: JSON.stringify(sessionData) }],
      });
      const result = await service.validateSession(sessionId, userId);
      expect(result).toBe(true);
      expect(mockPoolQuery).toHaveBeenCalledWith(
        'SELECT * FROM session WHERE sid = $1',
        [sessionId],
      );
    });

    it('returns false if session not found', async () => {
      const sessionId = 'invalid-session-id';
      const userId = '123';
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.validateSession(sessionId, userId);
      expect(result).toBe(false);
      expect(mockPoolQuery).toHaveBeenCalledWith(
        'SELECT * FROM session WHERE sid = $1',
        [sessionId],
      );
    });

    it('returns false if user ID does not match', async () => {
      const sessionId = 'valid-session-id';
      const userId = 'user-456';
      const sessionData = { userId: '123' };
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ sid: sessionId, sess: JSON.stringify(sessionData) }],
      });
      const result = await service.validateSession(sessionId, userId);
      expect(result).toBe(false);
    });

    it('returns false if sessionId or requestedUserId is missing', async () => {
      expect(await service.validateSession(null as any, '123')).toBe(false);
      expect(await service.validateSession('session-id', null as any)).toBe(
        false,
      );
      expect(mockPoolQuery).not.toHaveBeenCalled();
    });

    it('handles non-string sess data', async () => {
      const sessionId = 'valid-session-id';
      const userId = '123';
      const sessionData = { userId: '123' };
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ sid: sessionId, sess: sessionData }],
      });
      const result = await service.validateSession(sessionId, userId);
      expect(result).toBe(true);
    });
  });

  describe('getUserById', () => {
    const userId = 'user-abc';
    const mockUserData = {
      user_id: userId,
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      phone_number: '1234567890',
      business_name: 'Test Inc.',
      image_url: null,
      language: 'English',
      time_format: '24-hour',
      type: 'Producer',
      sub_type: '{Poultry,Fishery}',
    };
    const expectedUserData = {
      user_id: userId,
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      phone_number: '1234567890',
      business_name: 'Test Inc.',
      imageUrl: null,
      language: 'English',
      time_format: '24-hour',
      type: 'Producer',
      sub_type: ['Poultry', 'Fishery'],
    };

    it('returns user data if found', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [mockUserData] });
      const result = await service.getUserById(userId);
      expect(result.status).toBe(200);
      expect(result.data.user).toEqual(expectedUserData);
      expect(mockPoolQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE user_id = $1',
        [userId],
      );
    });

    it('returns 404 if user is not found', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.getUserById('non-existent-id');
      expect(result.status).toBe(404);
      expect(result.data.error).toBe('User not found');
    });

    it('returns 500 on database failure', async () => {
      const error = new Error('DB Error');
      mockPoolQuery.mockRejectedValueOnce(error);
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const result = await service.getUserById(userId);
      expect(result.status).toBe(500);
      expect(result.data.error).toBe('Failed to fetch user');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching user:',
        error,
      );
      consoleErrorSpy.mockRestore();
    });

    it('handles sub_type as an array', async () => {
      const mockUserDataWithArray = {
        ...mockUserData,
        sub_type: ['Poultry', 'Fishery'],
      };
      mockPoolQuery.mockResolvedValueOnce({ rows: [mockUserDataWithArray] });
      const result = await service.getUserById(userId);
      expect(result.status).toBe(200);
      expect(result.data.user?.sub_type).toEqual(['Poultry', 'Fishery']);
    });

    it('handles null or invalid sub_type', async () => {
      const mockUserDataNullSubType = { ...mockUserData, sub_type: null };
      mockPoolQuery.mockResolvedValueOnce({ rows: [mockUserDataNullSubType] });
      const result = await service.getUserById(userId);
      expect(result.status).toBe(200);
      expect(result.data.user?.sub_type).toEqual([]);
    });

    it('handles invalid sub_type formats gracefully', async () => {
      const mockInvalid = { ...mockUserData, sub_type: 12345 };
      mockPoolQuery.mockResolvedValueOnce({ rows: [mockInvalid] });

      const result = await service.getUserById(userId);
      expect(result.status).toBe(200);
      expect(result.data.user?.sub_type).toEqual([]);
    });
  });

  describe('updateUser', () => {
    const userId = 'user-def';
    const updateData = {
      first_name: 'Updated',
      last_name: 'Name',
      sub_type: ['Poultry', 'InvalidType', 'Animal Husbandry'],
    };

    it('updates user and returns 200 on success', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ user_id: userId }] });
      mockPoolQuery.mockResolvedValueOnce({ rowCount: 1 });
      const result = await service.updateUser(userId, updateData);
      expect(result.status).toBe(200);
      expect(result.data.message).toBe('User updated successfully');
      expect(mockPoolQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE user_id = $1',
        [userId],
      );

      const expectedUpdateQuery = `
      UPDATE users
      SET first_name = $1, last_name = $2, sub_type = $3
      WHERE user_id = $4
    `;
      const expectedValues = [
        'Updated',
        'Name',
        ['Poultry', 'Animal Husbandry'],
        userId,
      ];
      const updateCall = mockPoolQuery.mock.calls.find((call) =>
        call[0].trim().startsWith('UPDATE users'),
      );
      expect(updateCall).toBeDefined();
      expect(updateCall![0].replace(/\s+/g, ' ').trim()).toEqual(
        expectedUpdateQuery.replace(/\s+/g, ' ').trim(),
      );
      expect(updateCall![1]).toEqual(expectedValues);
    });

    it('returns 404 if user is not found', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.updateUser(userId, updateData);
      expect(result.status).toBe(404);
      expect(result.data.error).toBe('User not found');
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });

    it('returns 400 if no fields provided', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ user_id: userId }] });
      const result = await service.updateUser(userId, {});
      expect(result.status).toBe(400);
      expect(result.data.error).toBe('No fields to update');
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });

    it('returns 500 on database update failure', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ user_id: userId }] });
      const error = new Error('DB Update Error');
      mockPoolQuery.mockRejectedValueOnce(error);
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const result = await service.updateUser(userId, updateData);
      expect(result.status).toBe(500);
      expect(result.data.error).toBe('Failed to update user');
      expect(mockPoolQuery).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating user:',
        error,
      );
      consoleErrorSpy.mockRestore();
    });

    it('ignores unknown sub_type values and updates valid ones only', async () => {
      const updateData = {
        first_name: 'John',
        sub_type: ['Fishery', 'UnknownType', 'Animal Husbandry'],
      };

      mockPoolQuery.mockResolvedValueOnce({ rows: [{ user_id: userId }] });
      mockPoolQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await service.updateUser(userId, updateData);
      expect(result.status).toBe(200);
      expect(result.data.message).toBe('User updated successfully');
    });
  });

  describe('loginUser', () => {
    const loginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };
    const mockUser = {
      user_id: '123',
      first_name: 'Test',
      last_name: 'User',
      email: loginCredentials.email,
      phone_number: '123',
      business_name: 'Test Biz',
      password: 'hashed_password',
    };
    const mockSessionId = 'mock-session-id';
    let mockRes: Partial<Response>;

    beforeEach(() => {
      mockRes = createMockResponse();
      mockUuidv4.mockReturnValue(mockSessionId);
      mockSerialize.mockReturnValue('sid=mock-session-id; HttpOnly;...');
    });

    it('logs in successfully and sets cookie', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [mockUser] });
      mockArgon2Verify.mockResolvedValueOnce(true);
      mockPoolQuery.mockResolvedValueOnce({});
      const result = await service.loginUser(
        loginCredentials,
        mockRes as Response,
      );
      expect(result.status).toBe(200);
      expect(result.data.message).toBe('Login successful');
      expect(result.data.user?.user_id).toBe(mockUser.user_id);
      expect(mockPoolQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        [loginCredentials.email],
      );
      expect(mockArgon2Verify).toHaveBeenCalledWith(
        mockUser.password,
        loginCredentials.password,
      );
      expect(mockUuidv4).toHaveBeenCalled();
      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO session'),
        expect.arrayContaining([
          mockSessionId,
          expect.any(String),
          expect.any(Date),
        ]),
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.any(String),
      );
      expect(mockSerialize).toHaveBeenCalledWith(
        'sid',
        mockSessionId,
        expect.objectContaining({
          httpOnly: true,
          maxAge: 3 * 24 * 60 * 60,
          path: '/',
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production',
        }),
      );
    });

    it('returns 401 if user does not exist', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.loginUser(
        loginCredentials,
        mockRes as Response,
      );
      expect(result.status).toBe(401);
      expect(result.data.error).toBe('User does not exist');
      expect(mockArgon2Verify).not.toHaveBeenCalled();
      expect(mockRes.setHeader).not.toHaveBeenCalled();
    });

    it('returns 401 if password verification fails', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [mockUser] });
      mockArgon2Verify.mockResolvedValueOnce(false);
      const result = await service.loginUser(
        loginCredentials,
        mockRes as Response,
      );
      expect(result.status).toBe(401);
      expect(result.data.error).toBe('Invalid email or password.');
      expect(mockRes.setHeader).not.toHaveBeenCalled();
    });

    it('returns 400 if email or password is missing', async () => {
      let result = await service.loginUser(
        { email: 'test@example.com' },
        mockRes as Response,
      );
      expect(result.status).toBe(400);
      expect(result.data.error).toBe('Email and password are required.');

      result = await service.loginUser(
        { password: 'password123' },
        mockRes as Response,
      );
      expect(result.status).toBe(400);
      expect(result.data.error).toBe('Email and password are required.');
      expect(mockPoolQuery).not.toHaveBeenCalled();
    });

    it('returns 500 on database error during login', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [mockUser] });
      mockArgon2Verify.mockResolvedValueOnce(true);
      const dbError = new Error('DB session insert error');
      mockPoolQuery.mockRejectedValueOnce(dbError);
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const result = await service.loginUser(
        loginCredentials,
        mockRes as Response,
      );
      expect(result.status).toBe(500);
      expect(result.data.error).toBe('An internal server error occurred.');
      expect(mockRes.setHeader).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error during login:',
        dbError,
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('registerUser', () => {
    const registerData = {
      first_name: 'New',
      last_name: 'User',
      email: 'new@example.com',
      phone_number: '9876543210',
      business_name: 'New Biz',
      date_of_birth: '1990-01-01',
      password: 'newPassword123',
      type: 'Consumer',
    };
    const hashedPassword = 'hashed_new_password';
    const insertedUser = { user_id: 'new-user-id', ...registerData };

    it('registers a new user successfully', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });
      mockArgon2Hash.mockResolvedValueOnce(hashedPassword);
      mockPoolQuery.mockResolvedValueOnce({ rows: [insertedUser] });
      const result = await service.registerUser(registerData);
      expect(result.status).toBe(201);
      expect(result.data.message).toBe('User registered successfully');
      expect(result.data.user).toEqual(insertedUser);
      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE email'),
        [registerData.email, registerData.phone_number],
      );
      expect(mockArgon2Hash).toHaveBeenCalledWith(
        registerData.password,
        expect.any(Object),
      );
      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        [
          registerData.first_name,
          registerData.last_name,
          registerData.email,
          registerData.phone_number,
          registerData.business_name,
          registerData.date_of_birth,
          hashedPassword,
          registerData.type,
        ],
      );
    });

    it('returns 409 if email or phone number is in use', async () => {
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ user_id: 'existing-user' }],
      });
      const result = await service.registerUser(registerData);
      expect(result.status).toBe(409);
      expect(result.data.error).toBe('Email or phone number already in use');
      expect(mockArgon2Hash).not.toHaveBeenCalled();
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });

    it('returns 400 if required fields are missing', async () => {
      const incompleteData = { ...registerData };
      delete (incompleteData as any).email;
      const result = await service.registerUser(incompleteData);
      expect(result.status).toBe(400);
      expect(result.data.error).toBe('Missing required fields');
      expect(mockPoolQuery).not.toHaveBeenCalled();
    });

    it('returns 500 on database error during registration', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });
      mockArgon2Hash.mockResolvedValueOnce(hashedPassword);
      const dbError = new Error('DB insert error');
      mockPoolQuery.mockRejectedValueOnce(dbError);
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const result = await service.registerUser(registerData);
      expect(result.status).toBe(500);
      expect(result.data.error).toBe('Failed to register user');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error registering user:',
        dbError,
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('logoutUser', () => {
    const sessionId = 'session-to-delete';
    let mockRes: Partial<Response>;

    beforeEach(() => {
      mockRes = createMockResponse();
      mockSerialize.mockReturnValue('sid=; HttpOnly;...');
    });

    it('deletes session, clears cookie and returns 200 on success', async () => {
      mockPoolQuery.mockResolvedValueOnce({});
      const result = await service.logoutUser(sessionId, mockRes as Response);
      expect(result.status).toBe(200);
      expect(result.data.message).toBe('Logout successful.');
      expect(mockPoolQuery).toHaveBeenCalledWith(
        'DELETE FROM session WHERE sid = $1',
        [sessionId],
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.any(String),
      );
      expect(mockSerialize).toHaveBeenCalledWith(
        'sid',
        '',
        expect.objectContaining({ maxAge: 0 }),
      );
    });

    it('returns 400 if sessionId is not provided', async () => {
      const result = await service.logoutUser(null as any, mockRes as Response);
      expect(result.status).toBe(400);
      expect(result.data.error).toBe('No active session found.');
      expect(mockPoolQuery).not.toHaveBeenCalled();
      expect(mockRes.setHeader).not.toHaveBeenCalled();
    });

    it('returns 500 if database query fails', async () => {
      const error = new Error('DB Delete Error');
      mockPoolQuery.mockRejectedValueOnce(error);
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const result = await service.logoutUser(sessionId, mockRes as Response);
      expect(result.status).toBe(500);
      expect(result.data.error).toBe('An internal server error occurred.');
      expect(mockPoolQuery).toHaveBeenCalledWith(
        'DELETE FROM session WHERE sid = $1',
        [sessionId],
      );
      expect(mockRes.setHeader).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error during logout:',
        error,
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('deleteUser', () => {
    const userId = 'user-to-delete';
    const sessionId = 'active-session-id';
    let mockRes: Partial<Response>;

    beforeEach(() => {
      mockRes = createMockResponse();
      mockSerialize.mockReturnValue('sid=; HttpOnly;...');
    });

    it('deletes user, session, clears cookie and returns 200 on success', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ user_id: userId }] });
      mockPoolQuery.mockResolvedValueOnce({});
      mockPoolQuery.mockResolvedValueOnce({});
      const result = await service.deleteUser(
        userId,
        sessionId,
        mockRes as Response,
      );
      expect(result.status).toBe(200);
      expect(result.data.message).toBe('User deleted successfully');
      expect(mockPoolQuery).toHaveBeenNthCalledWith(
        1,
        'SELECT * FROM users WHERE user_id = $1',
        [userId],
      );
      expect(mockPoolQuery).toHaveBeenNthCalledWith(
        2,
        'DELETE FROM users WHERE user_id = $1',
        [userId],
      );
      expect(mockPoolQuery).toHaveBeenNthCalledWith(
        3,
        'DELETE FROM session WHERE sid = $1',
        [sessionId],
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.any(String),
      );
      expect(mockSerialize).toHaveBeenCalledWith(
        'sid',
        '',
        expect.objectContaining({ maxAge: 0 }),
      );
    });

    it('returns 404 if user to delete is not found', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.deleteUser(
        userId,
        sessionId,
        mockRes as Response,
      );
      expect(result.status).toBe(404);
      expect(result.data.error).toBe('User not found');
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
      expect(mockRes.setHeader).not.toHaveBeenCalled();
    });

    it('returns 500 if database error occurs during user deletion', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ user_id: userId }] });
      const dbError = new Error('DB User Delete Error');
      mockPoolQuery.mockRejectedValueOnce(dbError);
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const result = await service.deleteUser(
        userId,
        sessionId,
        mockRes as Response,
      );
      expect(result.status).toBe(500);
      expect(result.data.error).toBe('Failed to delete user');
      expect(mockPoolQuery).toHaveBeenCalledTimes(2);
      expect(mockPoolQuery).not.toHaveBeenCalledWith(
        'DELETE FROM session WHERE sid = $1',
        [sessionId],
      );
      expect(mockRes.setHeader).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting user:',
        dbError,
      );
      consoleErrorSpy.mockRestore();
    });

    it('returns 500 if database error occurs during session deletion', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ user_id: userId }] });
      mockPoolQuery.mockResolvedValueOnce({});
      const dbError = new Error('DB Session Delete Error');
      mockPoolQuery.mockRejectedValueOnce(dbError);
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const result = await service.deleteUser(
        userId,
        sessionId,
        mockRes as Response,
      );
      expect(result.status).toBe(500);
      expect(result.data.error).toBe('Failed to delete user');
      expect(mockPoolQuery).toHaveBeenCalledTimes(3);
      expect(mockRes.setHeader).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting user:',
        dbError,
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getUserTypeById', () => {
    const userId = 'user-type-check';
    const userType = 'Admin';

    it('returns user type if found', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ type: userType }] });
      const result = await service.getUserTypeById(userId);
      expect(result.status).toBe(200);
      expect(result.data.type).toBe(userType);
      expect(mockPoolQuery).toHaveBeenCalledWith(
        'SELECT type FROM users WHERE user_id = $1',
        [userId],
      );
    });

    it('returns 404 if user is not found', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.getUserTypeById('non-existent-id');
      expect(result.status).toBe(404);
      expect(result.data.error).toBe('User not found');
      expect(mockPoolQuery).toHaveBeenCalledWith(
        'SELECT type FROM users WHERE user_id = $1',
        ['non-existent-id'],
      );
    });

    it('returns 500 if database query fails', async () => {
      const error = new Error('DB Error');
      mockPoolQuery.mockRejectedValueOnce(error);
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const result = await service.getUserTypeById(userId);
      expect(result.status).toBe(500);
      expect(result.data.error).toBe('Failed to fetch user type');
      expect(mockPoolQuery).toHaveBeenCalledWith(
        'SELECT type FROM users WHERE user_id = $1',
        [userId],
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching user type:',
        error,
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('verifyPassword', () => {
    const userId = 'user-verify-pass';
    const correctPassword = 'password123';
    const incorrectPassword = 'wrongpassword';
    const hashedPassword = 'hashed_password_from_db';

    it('returns 200 and valid:true if password is correct', async () => {
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ password: hashedPassword }],
      });
      mockArgon2Verify.mockResolvedValueOnce(true);
      const result = await service.verifyPassword(userId, correctPassword);
      expect(result.status).toBe(200);
      expect(result.data.valid).toBe(true);
      expect(mockPoolQuery).toHaveBeenCalledWith(
        'SELECT password FROM users WHERE user_id = $1',
        [userId],
      );
      expect(mockArgon2Verify).toHaveBeenCalledWith(
        hashedPassword,
        correctPassword,
      );
    });

    it('returns 401 and valid:false if password is incorrect', async () => {
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ password: hashedPassword }],
      });
      mockArgon2Verify.mockResolvedValueOnce(false);
      const result = await service.verifyPassword(userId, incorrectPassword);
      expect(result.status).toBe(401);
      expect(result.data.valid).toBe(false);
      expect(mockPoolQuery).toHaveBeenCalledWith(
        'SELECT password FROM users WHERE user_id = $1',
        [userId],
      );
      expect(mockArgon2Verify).toHaveBeenCalledWith(
        hashedPassword,
        incorrectPassword,
      );
    });

    it('returns 404 if user is not found', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.verifyPassword(
        'non-existent-id',
        correctPassword,
      );
      expect(result.status).toBe(404);
      expect(result.data.error).toBe('User not found');
      expect(mockPoolQuery).toHaveBeenCalledWith(
        'SELECT password FROM users WHERE user_id = $1',
        ['non-existent-id'],
      );
      expect(mockArgon2Verify).not.toHaveBeenCalled();
    });

    it('returns 500 if database query fails', async () => {
      const error = new Error('DB Error');
      mockPoolQuery.mockRejectedValueOnce(error);
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const result = await service.verifyPassword(userId, correctPassword);
      expect(result.status).toBe(500);
      expect(result.data.error).toBe('Failed to verify password');
      expect(mockPoolQuery).toHaveBeenCalledWith(
        'SELECT password FROM users WHERE user_id = $1',
        [userId],
      );
      expect(mockArgon2Verify).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error verifying password:',
        error,
      );
      consoleErrorSpy.mockRestore();
    });

    it('returns 500 if argon2.verify fails', async () => {
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ password: hashedPassword }],
      });
      const argonError = new Error('Argon2 Error');
      mockArgon2Verify.mockRejectedValueOnce(argonError);
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const result = await service.verifyPassword(userId, correctPassword);
      expect(result.status).toBe(500);
      expect(result.data.error).toBe('Failed to verify password');
      expect(mockPoolQuery).toHaveBeenCalledWith(
        'SELECT password FROM users WHERE user_id = $1',
        [userId],
      );
      expect(mockArgon2Verify).toHaveBeenCalledWith(
        hashedPassword,
        correctPassword,
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error verifying password:',
        argonError,
      );
      consoleErrorSpy.mockRestore();
    });
  });
});
