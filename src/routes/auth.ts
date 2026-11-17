import { Router } from 'express';
import { login } from '../services/auth.js';
import { ApiError } from '../middleware/errorHandler.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body ?? {};
    if (typeof username !== 'string' || !username.trim() || typeof password !== 'string') {
      throw new ApiError(400, 'Username and password are required');
    }
    const token = await login(username.trim(), password); // Tjekker brugeren i service-laget
    res.json({ token });
  } catch (error) {
    next(error); // Fejlen bliver behandlet samme sted
  }
});
