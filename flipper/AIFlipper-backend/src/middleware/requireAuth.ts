import { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '../services/authService';

// Augment Express's Request so handlers can read req.userId with types intact.
// Set only by requireAuth, so its presence means the request is authenticated.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number;
      userEmail?: string;
    }
  }
}

// Gate for every data route. Rejects with 401 unless the request carries a valid,
// unexpired access token in `Authorization: Bearer <token>`. On success it stamps
// req.userId, which the handlers pass to the services so every query is scoped to
// the caller — no route may read or write another user's rows.
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  try {
    const payload = verifyAccess(token);
    if (!Number.isFinite(payload.sub)) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch {
    // Covers both a tampered signature and an expired token; the client responds
    // to a 401 on a data route by attempting a refresh, then retrying.
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
