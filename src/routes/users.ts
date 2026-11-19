import { Router } from 'express';
import { register } from '../services/auth.js';
import { getUser, updateUsername, removeUser, userDto } from '../services/users.js';
import { requireAuth, requireOwnUser } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';

export const usersRouter = Router();

function validUsername(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 100;
}

function validPassword(value: unknown): value is string {
  return typeof value === 'string'
    && value.length >= 8
    && Buffer.byteLength(value, 'utf8') <= 72; // bcrypt bruger kun de første 72 bytes
}

usersRouter.post('/', async (req, res, next) => {
  try {
    const { username, password } = req.body ?? {};
    if (!validUsername(username) || !validPassword(password)) {
      throw new ApiError(400, 'Username and password (8-72 bytes) are required');
    }
    const id = await register(username.trim(), password); // Gemmer ny bruger med hash
    const result = userDto({ user_id: id, username: username.trim() });
    res.status(201).location(result.uri).json(result);
  } catch (error) {
    next(error);
  }
});

usersRouter.use('/:id', requireAuth, requireOwnUser); // Alle ruter nedenfor er private

usersRouter.get('/:id', async (req, res, next) => {
  try {
    res.json(await getUser(Number(req.params.id)));
  } catch (error) { next(error); }
});

usersRouter.patch('/:id', async (req, res, next) => {
  try {
    if (!validUsername(req.body?.username)) throw new ApiError(400, 'Invalid username');
    res.json(await updateUsername(Number(req.params.id), req.body.username.trim()));
  } catch (error) { next(error); }
});

usersRouter.delete('/:id', async (req, res, next) => {
  try {
    await removeUser(Number(req.params.id));
    res.status(204).end(); // Sletter bruger og tilknyttede Framework-data
  } catch (error) { next(error); }
});
