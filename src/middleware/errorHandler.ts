import type { ErrorRequestHandler } from 'express';

export class ApiError extends Error {
  constructor(public status: number, message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export class NotFound extends ApiError { constructor(message: string) { super(404, message); } }
export class Conflict extends ApiError { constructor(message: string) { super(409, message); } }
export class ServiceUnavailable extends ApiError { constructor(message: string, options?: ErrorOptions) { super(503, message, options); } }
export class BadRequest extends ApiError { constructor(message: string) { super(400, message); } }

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) { next(err); return; }
  const known = err instanceof ApiError; // Fejl vi selv har lavet
  const duplicate = typeof err === 'object' && err !== null
    && 'code' in err && (err.code === '23505'
      || err.code === 'P0001' && 'message' in err && err.message === 'Username already exists');

  const status = known && [400, 401, 403, 404, 409, 503].includes(err.status)
    ? err.status
    : duplicate ? 409 : 500; // Ukendte fejl bliver 500

  const errors: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    503: 'Service Unavailable',
    500: 'Internal Server Error'
  };

  res.status(status).json({
    status: status, // HTTP status
    error: errors[status], // Typen af fejl
    message: known && status !== 500
      ? err.message
      : duplicate ? 'Username already exists'
      : 'Internal error', // Skjuler interne fejl
    timestamp: new Date().toISOString() // Tidspunkt for fejlen
  });
};
