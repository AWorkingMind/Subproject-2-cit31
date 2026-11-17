import type { ErrorRequestHandler } from 'express';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const known = err instanceof ApiError; // Fejl vi selv har lavet
  const duplicate = typeof err === 'object' && err !== null
    && 'code' in err && err.code === '23505'; // PostgreSQL: unik vaerdi findes allerede

  const status = known && [400, 401, 403, 404, 409].includes(err.status)
    ? err.status
    : duplicate ? 409 : 500; // Ukendte fejl bliver 500

  const errors: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    500: 'Internal Server Error'
  };

  res.status(status).json({
    status: status, // HTTP status
    error: errors[status], // Typen af fejl
    message: known && status !== 500
      ? err.message
      : duplicate ? 'Username already exists'
      : 'Something went wrong.', // Skjuler interne fejl
    timestamp: new Date().toISOString() // Tidspunkt for fejlen
  });
};
