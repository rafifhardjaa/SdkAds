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

const events: TelemetryEvent[] = [];

export function recordEvent(event: TelemetryEvent): void {
  events.push(event);
}

export function getStats(developerId: string, gameId?: string): StatsSummary {
  const filtered = events.filter(
    (e) => e.developerId === developerId && (!gameId || e.gameId === gameId)
  );

  const perGame = new Map<string, { impressions: number; clicks: number }>();

  for (const event of filtered) {
    const entry = perGame.get(event.gameId) ?? { impressions: 0, clicks: 0 };
    if (event.type === 'IMPRESSION') {
      entry.impressions++;
    } else if (event.type === 'CLICK') {
      entry.clicks++;
    }
    perGame.set(event.gameId, entry);
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