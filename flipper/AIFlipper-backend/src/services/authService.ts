import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { User } from '@flipper/shared';

// Access tokens are short-lived so a leaked one expires fast; refresh tokens are
// long-lived and exchanged for new access tokens at /auth/refresh. Both secrets
// are required — the server refuses to boot without them (see assertAuthConfig).
const ACCESS_TTL = '15m';
const REFRESH_TTL = '30d';
const BCRYPT_ROUNDS = 12;

// Read secrets lazily (not at import) so tests and tooling can import types from
// this module without a full env. Throwing here rather than signing with an
// undefined secret is what stops jwt from silently producing unverifiable tokens.
const accessSecret = (): string => {
  const s = process.env.JWT_ACCESS_SECRET;
  if (!s) throw new Error('JWT_ACCESS_SECRET is not set');
  return s;
};
const refreshSecret = (): string => {
  const s = process.env.JWT_REFRESH_SECRET;
  if (!s) throw new Error('JWT_REFRESH_SECRET is not set');
  return s;
};

// Fail fast at boot rather than on the first login attempt.
export const assertAuthConfig = (): void => {
  accessSecret();
  refreshSecret();
};

export interface TokenPayload {
  sub: number; // user id
  email: string;
}

const signAccess = (payload: TokenPayload): string =>
  jwt.sign(payload, accessSecret(), { expiresIn: ACCESS_TTL });

const signRefresh = (payload: TokenPayload): string =>
  jwt.sign(payload, refreshSecret(), { expiresIn: REFRESH_TTL });

export const verifyAccess = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, accessSecret()) as jwt.JwtPayload;
  return { sub: Number(decoded.sub), email: String(decoded.email) };
};

export const verifyRefresh = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, refreshSecret()) as jwt.JwtPayload;
  return { sub: Number(decoded.sub), email: String(decoded.email) };
};

const rowToUser = (row: { id: number; email: string; created_at: Date | string }): User => ({
  id: row.id,
  email: row.email,
  createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
});

// Normalise emails so 'A@x.com' and 'a@x.com ' can't become two accounts.
const normalizeEmail = (email: unknown): string =>
  typeof email === 'string' ? email.trim().toLowerCase() : '';

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

const issueTokens = (user: User): AuthResult => {
  const payload: TokenPayload = { sub: user.id, email: user.email };
  return { user, accessToken: signAccess(payload), refreshToken: signRefresh(payload) };
};

export const registerUser = async (rawEmail: unknown, rawPassword: unknown): Promise<AuthResult> => {
  const email = normalizeEmail(rawEmail);
  const password = typeof rawPassword === 'string' ? rawPassword : '';
  if (!email || !email.includes('@')) throw new AuthError(400, 'A valid email is required');
  if (password.length < 8) throw new AuthError(400, 'Password must be at least 8 characters');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // A fresh user also needs a settings row. Do both in one transaction so a user
  // can never exist without settings (getSettings falls back, but the row keeps
  // the FK model honest and gives updateSettings a target).
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) throw new AuthError(409, 'An account with that email already exists');

    const { rows } = await client.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    );
    const user = rowToUser(rows[0]);
    await client.query('INSERT INTO settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [user.id]);
    await client.query('COMMIT');
    return issueTokens(user);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const loginUser = async (rawEmail: unknown, rawPassword: unknown): Promise<AuthResult> => {
  const email = normalizeEmail(rawEmail);
  const password = typeof rawPassword === 'string' ? rawPassword : '';

  const { rows } = await pool.query(
    'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
    [email]
  );
  // Same error whether the email is unknown or the password is wrong, so the
  // response can't be used to enumerate which emails have accounts. The legacy
  // seed user has a null password_hash and therefore can never authenticate.
  const row = rows[0];
  if (!row || !row.password_hash) throw new AuthError(401, 'Invalid email or password');

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) throw new AuthError(401, 'Invalid email or password');

  return issueTokens(rowToUser(row));
};

// Exchange a valid refresh token for a fresh token pair. The user is re-read so a
// deleted account can't keep minting access tokens off an old refresh token.
export const refreshTokens = async (rawRefreshToken: unknown): Promise<AuthResult> => {
  const token = typeof rawRefreshToken === 'string' ? rawRefreshToken : '';
  if (!token) throw new AuthError(400, 'A refresh token is required');

  let payload: TokenPayload;
  try {
    payload = verifyRefresh(token);
  } catch {
    throw new AuthError(401, 'Invalid or expired refresh token');
  }

  const { rows } = await pool.query('SELECT id, email, created_at FROM users WHERE id = $1', [payload.sub]);
  if (rows.length === 0) throw new AuthError(401, 'Account no longer exists');
  return issueTokens(rowToUser(rows[0]));
};

export const getUserById = async (id: number): Promise<User | null> => {
  const { rows } = await pool.query('SELECT id, email, created_at FROM users WHERE id = $1', [id]);
  return rows.length > 0 ? rowToUser(rows[0]) : null;
};
