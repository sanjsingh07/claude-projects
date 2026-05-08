
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

  it('should parse birthTime as UTC during registration', async () => {
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
    const birthTime = callArgs.birthTime;

    expect(birthTime).toBeDefined();
    expect(birthTime instanceof Date).toBe(true);
    // 06:00 UTC
    expect(birthTime.getUTCHours()).toBe(6);
    expect(birthTime.getUTCMinutes()).toBe(0);
    // Verify it's not affected by local timezone if we check UTC parts
    expect(birthTime.toISOString()).toContain('T06:00:00.000Z');
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
