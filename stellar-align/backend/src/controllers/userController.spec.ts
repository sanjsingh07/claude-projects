
import { describe, it, expect, vi } from 'vitest';
import { userController } from './userController';
import { prisma } from '../config/database';
import { ApiError } from '../utils/errors';

// Mock prisma
vi.mock('../config/database', () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('../config/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock cache
vi.mock('../config/redis', () => ({
  cache: {
    delete: vi.fn().mockResolvedValue(true),
  },
}));

describe('userController.updateCurrentUser', () => {
  it('should throw an ApiError for invalid birthTime format', async () => {
    const req = {
      userId: 'test-user-id',
      body: {
        birthTime: 'invalid-time',
      },
    } as any;

    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as any;

    const next = vi.fn();

    await userController.updateCurrentUser(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('Invalid birth time');
    
    // Prisma should NOT be called
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should throw an ApiError for out of range birthTime values', async () => {
    const req = {
      userId: 'test-user-id',
      body: {
        birthTime: '25:61',
      },
    } as any;

    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as any;

    const next = vi.fn();

    await userController.updateCurrentUser(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('Invalid birth time');
    
    // Prisma should NOT be called
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should successfully update for valid birthTime', async () => {
    const req = {
      userId: 'test-user-id',
      body: {
        birthTime: '12:30',
      },
    } as any;

    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as any;

    const next = vi.fn();
    (prisma.user.update as any).mockResolvedValue({ id: 'test-user-id' });

    await userController.updateCurrentUser(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        birthTime: expect.any(Date)
      })
    }));

    const callArgs = (prisma.user.update as any).mock.calls[0][0];
    const birthTime = callArgs.data.birthTime;
    expect(birthTime.getUTCHours()).toBe(12);
    expect(birthTime.getUTCMinutes()).toBe(30);
  });
});
