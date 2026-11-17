import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { ApiError, errorHandler } from './middleware/errorHandler.js';

import healthRouter from './routes/health.js';
import titlesRouter from './routes/titles.js';
import peopleRouter from './routes/people.js';
import ratingsRouter from './routes/ratings.js';

export const app = express();

// Kun Subproject 3's konfigurerede origin får lov til at kalde API'et.
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: (origin, callback) => {
    callback(null, !origin || origin === frontendOrigin);
  }
}));
app.use(express.json()); // Så kan vi læse JSON fra requests

// Ugyldig JSON skal give 400, ikke en ukendt 500-fejl
app.use((err: unknown, _req: express.Request, _res: express.Response, next: express.NextFunction) => {
  if (typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed') {
    next(new ApiError(400, 'Invalid JSON body'));
  } else {
    next(err);
  }
});

app.use('/api/auth', authRouter); // POST /api/auth/login
app.use('/api/health', healthRouter);
app.use('/api/titles', titlesRouter);
app.use('/api/people', peopleRouter);
app.use('/api/users', ratingsRouter);
app.use('/api/users', usersRouter); // POST, GET, PATCH og DELETE

app.use((_req, _res, next) => next(new ApiError(404, 'Route not found'))); // Ukendt endpoint
app.use(errorHandler); // SKAL stå efter alle ruterne

export default app;
