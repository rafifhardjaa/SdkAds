import express, { Express, NextFunction, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { rateLimit } from 'express-rate-limit';
import { authenticateDeveloper, AuthenticatedRequest } from './middleware';
import { findGameForDeveloper } from './store';
import { getStats, recordEvent, TelemetryEvent } from './telemetry';

interface TelemetryBody {
  gameId?: unknown;
  placementId?: unknown;
  type?: unknown;
  timestamp?: unknown;
}

const app: Express = express();
app.use(cors());
app.use(express.json({ limit: '16kb' }));

app.use(express.static(path.join(__dirname)));

// ---- Rate limiting ----
const configLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const telemetryLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// ---- Validation helpers ----
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const TYPE_PATTERN = /^[A-Z]{1,32}$/;

function sanitizeTelemetry(body: TelemetryBody): { event: TelemetryEvent; error: null } | { event: null; error: string } {
  const gameId = typeof body.gameId === 'string' ? body.gameId.trim() : '';
  const type = typeof body.type === 'string' ? body.type.trim().toUpperCase() : '';
  const placementId =
    typeof body.placementId === 'string' && body.placementId.trim()
      ? body.placementId.trim()
      : 'pre-roll';

  if (!ID_PATTERN.test(gameId)) {
    return { event: null, error: 'Invalid gameId' };
  }
  if (!TYPE_PATTERN.test(type)) {
    return { event: null, error: 'Invalid type' };
  }
  if (!ID_PATTERN.test(placementId)) {
    return { event: null, error: 'Invalid placementId' };
  }

  let timestamp = Date.now();
  if (body.timestamp !== undefined) {
    const parsed = Number(body.timestamp);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return { event: null, error: 'Invalid timestamp' };
    }
    timestamp = Math.floor(parsed);
  }

  return {
    event: {
      developerId: '',
      gameId,
      placementId,
      type,
      timestamp,
    },
    error: null,
  };
}

app.get('/dashboard', (_req, res: Response) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/health', (_req, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/config', configLimiter, authenticateDeveloper, (req: AuthenticatedRequest, res: Response) => {
  const developer = req.developer!;
  const rawGameId = req.query.gameId;
  const gameId = typeof rawGameId === 'string' ? rawGameId : '';
  const config = findGameForDeveloper(developer, gameId);

  if (!config) {
    res.status(404).json({ error: 'Game not found', gameId });
    return;
  }

  res.json(config);
});

app.post(
  '/api/telemetry',
  telemetryLimiter,
  authenticateDeveloper,
  (req: AuthenticatedRequest, res: Response) => {
    const developer = req.developer!;
    const body: TelemetryBody = req.body ?? {};

    if (!body.gameId || !body.type) {
      res.status(400).json({ error: 'Missing required fields: gameId, type' });
      return;
    }

    const sanitized = sanitizeTelemetry(body);
    if (sanitized.error || !sanitized.event) {
      res.status(400).json({ error: sanitized.error || 'Invalid payload' });
      return;
    }

    if (!findGameForDeveloper(developer, sanitized.event.gameId)) {
      res.status(403).json({ error: 'Forbidden: game not owned by developer' });
      return;
    }

    const event: TelemetryEvent = { ...sanitized.event, developerId: developer.id };
    recordEvent(event);
    console.log('[telemetry]', JSON.stringify(event));

    res.status(201).json({ status: 'received', event });
  }
);

app.get('/api/stats', authenticateDeveloper, (req: AuthenticatedRequest, res: Response) => {
  const developer = req.developer!;
  const rawGameId = req.query.gameId;
  const gameId = typeof rawGameId === 'string' ? rawGameId : undefined;

  if (gameId && !findGameForDeveloper(developer, gameId)) {
    res.status(404).json({ error: 'Game not found', gameId });
    return;
  }

  res.json(getStats(developer.id, gameId));
});

// ---- Centralized error handler (never leaks stack traces) ----
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error & { status?: number; statusCode?: number; type?: string }, _req: unknown, res: Response, _next: NextFunction) => {
  const status = err.statusCode ?? err.status ?? 500;
  if (status >= 500) {
    console.error('[error]', err.message);
  }
  const message = status >= 500 ? 'Internal server error' : 'Invalid request';
  res.status(status).json({ error: message });
});

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`[SDK Ads] Backend API listening on http://localhost:${PORT}`);
});