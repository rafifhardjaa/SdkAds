import express, { Express, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { authenticateDeveloper, AuthenticatedRequest } from './middleware';
import { findGameForDeveloper } from './store';
import { getStats, recordEvent } from './telemetry';

interface TelemetryEvent {
  gameId?: string;
  placementId?: string;
  type?: string;
  timestamp?: string | number;
}

const app: Express = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname)));

app.get('/dashboard', (_req, res: Response) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/health', (_req, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/config', authenticateDeveloper, (req: AuthenticatedRequest, res: Response) => {
  const developer = req.developer!;
  const gameId = String(req.query.gameId || '');
  const config = findGameForDeveloper(developer, gameId);

  if (!config) {
    res.status(404).json({ error: 'Game not found', gameId });
    return;
  }

  res.json(config);
});

app.post('/api/telemetry', authenticateDeveloper, (req: AuthenticatedRequest, res: Response) => {
  const developer = req.developer!;
  const body: TelemetryEvent = req.body ?? {};

  if (!body.gameId || !body.type) {
    res.status(400).json({ error: 'Missing required fields: gameId, type' });
    return;
  }

  if (!findGameForDeveloper(developer, body.gameId)) {
    res.status(403).json({ error: 'Forbidden: game not owned by developer' });
    return;
  }

  const event = {
    ...body,
    developerId: developer.id,
    placementId: body.placementId || 'pre-roll',
    timestamp: body.timestamp || Date.now(),
  };

  recordEvent(event);
  console.log('[telemetry]', JSON.stringify(event));

  res.status(201).json({ status: 'received', event });
});

app.get('/api/stats', authenticateDeveloper, (req: AuthenticatedRequest, res: Response) => {
  const developer = req.developer!;
  const gameId = req.query.gameId ? String(req.query.gameId) : undefined;

  if (gameId && !findGameForDeveloper(developer, gameId)) {
    res.status(404).json({ error: 'Game not found', gameId });
    return;
  }

  res.json(getStats(developer.id, gameId));
});

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`[SDK Ads] Backend API listening on http://localhost:${PORT}`);
});