export interface Game {
  gameId: string;
  adDuration: number;
  placementId: string;
}

export interface Developer {
  id: string;
  name: string;
  apiKey: string;
  games: Game[];
}

export interface AdConfig {
  gameId: string;
  adDuration: number;
  placementId: string;
}

const developers: Developer[] = [
  {
    id: 'dev-demo',
    name: 'Demo Developer',
    apiKey: 'dev-key-demo',
    games: [
      {
        gameId: 'demo-game',
        adDuration: 5,
        placementId: 'pre-roll',
      },
    ],
  },
];

export function findDeveloperByApiKey(apiKey: string): Developer | undefined {
  return developers.find((d) => d.apiKey === apiKey);
}

export function findGameForDeveloper(
  developer: Developer,
  gameId: string
): Game | undefined {
  return developer.games.find((g) => g.gameId === gameId);
}