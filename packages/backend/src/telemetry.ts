import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export interface TelemetryEvent {
  developerId: string;
  gameId: string;
  placementId: string;
  type: string;
  timestamp: number;
}

export interface GameStats {
  gameId: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface StatsSummary {
  developerId: string;
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  games: GameStats[];
}

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'telemetry.db');

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  const dbPath = process.env.DB_PATH || DEFAULT_DB_PATH;
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS telemetry_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      developer_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      placement_id TEXT NOT NULL,
      type TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_events_developer_game
      ON telemetry_events (developer_id, game_id);
  `);

  return db;
}

export function recordEvent(event: TelemetryEvent): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO telemetry_events (developer_id, game_id, placement_id, type, timestamp)
     VALUES (?, ?, ?, ?, ?)`
  ).run(event.developerId, event.gameId, event.placementId, event.type, event.timestamp);
}

export function getStats(developerId: string, gameId?: string): StatsSummary {
  const db = getDb();

  const params: string[] = [developerId];
  let gameFilter = '';
  if (gameId) {
    gameFilter = 'AND game_id = ?';
    params.push(gameId);
  }

  const rows = db
    .prepare(
      `SELECT game_id AS gameId, type, COUNT(*) AS count
       FROM telemetry_events
       WHERE developer_id = ? ${gameFilter}
       GROUP BY game_id, type`
    )
    .all(...params) as Array<{ gameId: string; type: string; count: number }>;

  const perGame = new Map<string, { impressions: number; clicks: number }>();

  for (const row of rows) {
    const entry = perGame.get(row.gameId) ?? { impressions: 0, clicks: 0 };
    if (row.type === 'IMPRESSION') {
      entry.impressions = row.count;
    } else if (row.type === 'CLICK') {
      entry.clicks = row.count;
    }
    perGame.set(row.gameId, entry);
  }

  const games: GameStats[] = Array.from(perGame.entries()).map(([gid, counts]) => ({
    gameId: gid,
    impressions: counts.impressions,
    clicks: counts.clicks,
    ctr: counts.impressions > 0 ? counts.clicks / counts.impressions : 0,
  }));

  const totalImpressions = games.reduce((sum, g) => sum + g.impressions, 0);
  const totalClicks = games.reduce((sum, g) => sum + g.clicks, 0);

  return {
    developerId,
    totalImpressions,
    totalClicks,
    ctr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
    games,
  };
}