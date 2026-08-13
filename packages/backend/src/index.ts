import express, { Express, Request, Response } from 'express';
import cors from 'cors';

interface AdConfig {
  gameId: string;
  adDuration: number;
  placementId: string;
}

interface TelemetryEvent {
  gameId?: string;
  placementId?: string;
  type?: string;
  timestamp?: string | number;
}

const DEFAULT_AD_DURATION = 5;
const DEFAULT_PLACEMENT_ID = 'pre-roll';

const DEFAULT_CONFIGS: Record<string, AdConfig> = {
  'demo-game': {
    gameId: 'demo-game',
    adDuration: DEFAULT_AD_DURATION,
    placementId: DEFAULT_PLACEMENT_ID,
  },
};

const app: Express = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/config', (req: Request, res: Response) => {
  const gameId = String(req.query.gameId || '');
  const config = DEFAULT_CONFIGS[gameId];

  if (!config) {
    res.status(404).json({ error: 'Game not found', gameId });
    return;
  }

  res.json(config);
});

app.post('/api/telemetry', (req: Request, res: Response) => {
  const body: TelemetryEvent = req.body ?? {};

  if (!body.gameId || !body.type) {
    res.status(400).json({ error: 'Missing required fields: gameId, type' });
    return;
  }

  const event = {
    ...body,
    timestamp: body.timestamp || Date.now(),
  };

  console.log('[telemetry]', JSON.stringify(event));

  res.status(201).json({ status: 'received', event });
});

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`[SDK Ads] Backend API listening on http://localhost:${PORT}`);
});