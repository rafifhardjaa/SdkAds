import { NextFunction, Request, Response } from 'express';
import { Developer, findDeveloperByApiKey } from './store';

export interface AuthenticatedRequest extends Request {
  developer?: Developer;
}

// Extra allowed origins from env (comma-separated), e.g. in production:
// ALLOWED_ORIGINS=https://game.example.com,https://cdn.example.com
const EXTRA_ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Set REQUIRE_ORIGIN_CHECK=false to bypass origin validation (dev only).
const REQUIRE_ORIGIN_CHECK = process.env.REQUIRE_ORIGIN_CHECK !== 'false';

function getRequestOrigin(req: Request): string {
  const origin = req.headers.origin;
  if (origin && origin !== 'null') return origin;

  const referer = req.headers.referer;
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return '';
    }
  }
  return '';
}

function isOriginAllowed(developer: Developer, origin: string): boolean {
  const allowed = new Set([...developer.allowedOrigins, ...EXTRA_ALLOWED_ORIGINS]);
  return allowed.has(origin);
}

export function authenticateDeveloper(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const apiKey = match ? match[1].trim() : '';

  if (!apiKey) {
    res.status(401).json({ error: 'Unauthorized: missing developer key' });
    return;
  }

  const developer = findDeveloperByApiKey(apiKey);
  if (!developer) {
    res.status(401).json({ error: 'Unauthorized: invalid developer key' });
    return;
  }

  // Origin / Referer validation: prevent API key abuse from unregistered
  // domains. Requests with no browser origin (CLI / server-to-server) pass.
  if (REQUIRE_ORIGIN_CHECK) {
    const origin = getRequestOrigin(req);
    if (origin && !isOriginAllowed(developer, origin)) {
      res.status(403).json({ error: 'Forbidden: origin not allowed' });
      return;
    }
  }

  req.developer = developer;
  next();
}