import { Router } from 'express';
import { register } from '../services/auth.js';
import { getUser, updateUsername, updatePassword, removeUser, userDto } from '../services/users.js';
import { requireAuth, requireOwnUser } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { validPassword } from '../auth/passwords.js';

export const usersRouter = Router();

function validUsername(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 100;
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
  } catch (error) {
    next(error);
  }
});

usersRouter.patch('/:id', async (req, res, next) => {
  try {
    const { username, currentPassword, newPassword } = req.body ?? {};
    const hasUsername = username !== undefined;
    const hasCurrentPassword = currentPassword !== undefined;
    const hasNewPassword = newPassword !== undefined;

    if (hasUsername && !hasCurrentPassword && !hasNewPassword) {
      if (!validUsername(username)) throw new ApiError(400, 'Invalid username');
      res.json(await updateUsername(Number(req.params.id), username.trim()));
      return;
    }

    if (!hasUsername && hasCurrentPassword && hasNewPassword) {
      if (typeof currentPassword !== 'string' || !validPassword(newPassword)) {
        throw new ApiError(400, 'Invalid new password');
      }
      res.json(await updatePassword(Number(req.params.id), currentPassword, newPassword));
      return;
    }

    throw new ApiError(400, 'Send either username or currentPassword and newPassword');
  } catch (error) {
    next(error);
  }
});

usersRouter.delete('/:id', async (req, res, next) => {
  try {
    await removeUser(Number(req.params.id));
    res.status(204).end(); // Sletter bruger og tilknyttede Framework-data
  } catch (error) {
    next(error);
  }
});
