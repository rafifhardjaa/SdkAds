import { NextFunction, Request, Response } from 'express';
import { Developer, findDeveloperByApiKey } from './store';

export interface AuthenticatedRequest extends Request {
  developer?: Developer;
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

  req.developer = developer;
  next();
}