import { findUserByName, findUserByNameOn, createUserOn } from '../data/users.js';
import { hashPassword, verifyPassword } from '../auth/passwords.js';
import { signToken } from '../auth/tokens.js';
import { ApiError } from '../middleware/errorHandler.js';
import { pool } from '../db.js';

export async function register(username: string, password: string): Promise<number> {
  const hash = await hashPassword(password); // Vi gemmer kun hash i databasen
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (await findUserByNameOn(client, username)) {
      throw new ApiError(409, 'Username already exists');
    }
    const id = await createUserOn(client, username, hash);
    await client.query('COMMIT');
    return id;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release(); // Giver forbindelsen tilbage til poolen
  }
}

export async function login(username: string, password: string): Promise<string> {
  const user = await findUserByName(username);
  const correct = user ? await verifyPassword(password, user.password_hash) : false;
  if (!user || !correct) throw new ApiError(401, 'Wrong username or password'); // Samme fejl for begge
  return signToken(user.user_id); // Token er knyttet til brugerens id
}
