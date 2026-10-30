import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import apiRoutes from './routes';
import { pool } from './db/pool';
import { initDb } from './db/initDb';
import { assertAuthConfig } from './services/authService';

const app = express();
const port = process.env.PORT || 3000;

// Behind no proxy in dev, but a deployment will sit behind one; trust it so
// express-rate-limit keys on the real client IP rather than the proxy's.
app.set('trust proxy', 1);

// Secure headers. The API serves JSON only, so the restrictive helmet defaults
// need no relaxing (no inline scripts, no cross-origin embeds to allow).
app.use(helmet());

// CORS: the old `cors()` reflected any Origin, on a LAN-exposed API that proxies
// two paid third-party APIs. Restrict to an explicit allowlist from env
// (comma-separated), e.g. the Expo dev host. A request with no Origin (native
// mobile app, curl, server-to-server) is allowed — browsers always send one, so
// this only gates browser cross-origin calls, which is where CORS matters.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // non-browser client
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
  })
);

// Concise one-line request logs. 'dev' in development, 'combined' otherwise.
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(express.json({ limit: '10mb' }));

// Deep health check: confirms the process is up AND the database is reachable,
// so a load balancer can drain this instance when its pool can't serve. A
// shallow 200 would keep routing traffic to an instance that 500s every query.
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', db: 'up' });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'down' });
  }
});

// Rate limit the paid-API proxy. /identify calls Google Vision AND SerpApi per
// request; without a cap one authenticated account can run up the bill. Keyed by
// user id (set by requireAuth, which runs after this in the chain) falling back
// to IP. 30 requests / 5 min is generous for hand-scanning, ruinous for a script.
const identifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  // ipKeyGenerator normalizes IPv6 to a /64 subnet so a user can't cycle
  // addresses within their prefix to bypass the limit. Fall back to it when
  // there's no authenticated user id to key on.
  keyGenerator: (req: Request) => (req.userId ? `u:${req.userId}` : ipKeyGenerator(req.ip ?? 'unknown')),
  message: { error: 'Too many scans. Wait a few minutes and try again.' },
});
app.use('/api/identify', identifyLimiter);

app.use('/api', apiRoutes);

// 404 for any unmatched route — a JSON body, not Express's default HTML.
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Central error handler. express.json() throws a SyntaxError on a malformed body;
// without this the client got an HTML stack trace (and a leak of internals). Now
// every error becomes a clean JSON response. The 4-arg signature is what marks
// this as an error handler to Express, so `next` must stay even though unused.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ error: 'Malformed JSON in request body' });
  }
  if (err?.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Bring the schema up to date (and seed a fresh DB from the legacy JSON) before
// accepting requests. commonjs has no top-level await, so this lives in an async
// start() instead of running at import time the way the old file-based init did.
const start = async () => {
  // Fail fast if the JWT secrets are missing rather than at first login.
  assertAuthConfig();
  await initDb();

  const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`- Database: connected and migrated`);
    console.log(`- CORS: ${allowedOrigins.length ? allowedOrigins.join(', ') : 'all origins (no allowlist set)'}`);
    console.log(`- SerpApi Key: ${process.env.SERPAPI_KEY ? 'LOADED' : 'MISSING'}`);
    console.log(`- Google Vision Credentials: ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
  });

  // Graceful shutdown: stop accepting new connections, let in-flight requests
  // finish, then close the DB pool so no query is cut off mid-transaction. A
  // hard timeout backstops a hung connection so the process can't hang forever.
  const shutdown = (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully.`);
    const force = setTimeout(() => {
      console.error('Forced shutdown after 10s timeout.');
      process.exit(1);
    }, 10_000);
    force.unref();

    // server.close's callback is void-returning, so run the async cleanup in an
    // IIFE rather than handing it an async function (which would float a Promise).
    server.close(() => {
      void (async () => {
        try {
          await pool.end();
          console.log('HTTP server and database pool closed.');
          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err);
          process.exit(1);
        }
      })();
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
