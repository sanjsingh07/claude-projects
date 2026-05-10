
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from './authController';
import { authService } from '../services/auth.service';

// Mock authService
vi.mock('../services/auth.service', () => ({
  authService: {
    register: vi.fn(),
  },
}));

// Mock prisma
vi.mock('../config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
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

describe('AuthController.register', () => {
  let authController: AuthController;

  beforeEach(() => {
    authController = new AuthController();
    vi.clearAllMocks();
  });

  it('should parse birthTime into birthDateTime during registration', async () => {
    const req = {
      body: {
        email: 'test@example.com',
        password: 'password123',
        birthDate: '1990-01-01',
        birthTime: '06:00',
        birthTimezone: 'Asia/Kolkata',
        displayName: 'Test User',
      },
    } as any;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;

    const next = vi.fn();

    const mockResult = {
      user: { id: 'user-123' },
      tokens: { accessToken: 'at', refreshToken: 'rt' },
    };
    (authService.register as any).mockResolvedValue(mockResult);

    await authController.register(req, res, next);

    expect(authService.register).toHaveBeenCalled();
    const callArgs = (authService.register as any).mock.calls[0][0];
    const birthDateTime = callArgs.birthDateTime;

    expect(birthDateTime).toBeDefined();
    expect(birthDateTime instanceof Date).toBe(true);
    // 06:00
    expect(birthDateTime.getUTCHours()).toBe(6);
    expect(birthDateTime.getUTCMinutes()).toBe(0);
    // Verify it's correctly formatted as UTC date
    expect(birthDateTime.toISOString()).toContain('1990-01-01T06:00:00.000Z');
  });

  it('should correctly handle ISO birthDate with timezone shifts', async () => {
    const req = {
      body: {
        email: 'test@example.com',
        password: 'password123',
        // 1997-08-23 00:00 IST (+5:30) is 1997-08-22 18:30 UTC
        birthDate: '1997-08-22T18:30:00.000Z',
        birthTime: '11:30',
        birthTimezone: 'Asia/Kolkata',
      },
    } as any;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;

    (authService.register as any).mockResolvedValue({ user: { id: '1' }, tokens: {} });

    await authController.register(req, res, vi.fn());

    const callArgs = (authService.register as any).mock.calls[0][0];
    const birthDateTime = callArgs.birthDateTime;

    // Should be Aug 23, 1997 at 11:30
    expect(birthDateTime.getUTCFullYear()).toBe(1997);
    expect(birthDateTime.getUTCMonth()).toBe(7); // August
    expect(birthDateTime.getUTCDate()).toBe(23);
    expect(birthDateTime.getUTCHours()).toBe(11);
    expect(birthDateTime.getUTCMinutes()).toBe(30);
  });

  it('should handle missing birthTime', async () => {
    const req = {
      body: {
        email: 'test@example.com',
        password: 'password123',
        birthDate: '1990-01-01',
        birthTimezone: 'Asia/Kolkata',
      },
    } as any;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;

    const next = vi.fn();

    (authService.register as any).mockResolvedValue({ user: {}, tokens: {} });

    await authController.register(req, res, next);

    const callArgs = (authService.register as any).mock.calls[0][0];
    expect(callArgs.birthTime).toBeUndefined();
  });
});
