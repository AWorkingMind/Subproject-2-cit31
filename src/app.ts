import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { ApiError, errorHandler } from './middleware/errorHandler.js';

export const app = express();

// Kun Subproject 3's konfigurerede origin faar lov til at kalde API'et.
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: (origin, callback) => {
    callback(null, !origin || origin === frontendOrigin);
  }
}));
app.use(express.json()); // Saa kan vi laese JSON fra requests

// Ugyldig JSON skal give 400, ikke en ukendt 500-fejl
app.use((err: unknown, _req: express.Request, _res: express.Response, next: express.NextFunction) => {
  if (typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed') {
    next(new ApiError(400, 'Invalid JSON body'));
  } else {
    next(err);
  }
});

app.use('/api/auth', authRouter); // POST /api/auth/login
app.use('/api/users', usersRouter); // POST, GET, PATCH og DELETE

// HER skal Person 1 og Person 2 senere saette deres ruter ind.
// Fx: app.use('/api/titles', titlesRouter);

app.use((_req, _res, next) => next(new ApiError(404, 'Route not found'))); // Ukendt endpoint
app.use(errorHandler); // SKAL staa efter alle ruterne
