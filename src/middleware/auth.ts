import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth/tokens.js';
import { ApiError } from './errorHandler.js';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization; // Finder Authorization-headeren
  if (!header?.startsWith('Bearer ')) {
    next(new ApiError(401, 'Missing token'));
    return;
  }

  try {
    const user = verifyToken(header.slice(7)); // Fjerner ordet Bearer fra headeren
    if (!user) {
      next(new ApiError(401, 'Invalid or expired token'));
      return;
    }
    res.locals.userId = user.userId; // Gemmer brugeren til næste middleware
    next();
  } catch (error) {
    next(error); // Fx hvis serverens JWT_SECRET mangler
  }
}

export function requireOwnUser(req: Request, res: Response, next: NextFunction): void {
  const id = req.params.id;
  if (typeof id !== 'string' || !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    next(new ApiError(400, 'Invalid user ID'));
    return;
  }
  if (Number(id) !== res.locals.userId) {
    next(new ApiError(403, 'Not your user account')); // Kun ens egen bruger
    return;
  }
  next();
}
