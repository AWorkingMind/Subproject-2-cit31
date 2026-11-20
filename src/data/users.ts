import type { PoolClient } from 'pg';
import { pool } from '../db.js';
import type { User } from '../types/User.js';

export async function findUserByName(username: string): Promise<User | undefined> {
  const { rows } = await pool.query<User>(
    'SELECT user_id, username, password_hash FROM users WHERE username = $1',
    [username]); // $1 holder brugerens tekst adskilt fra SQL
  return rows[0];
}

// Bruges af registreringen, så tjek og oprettelse kan være samme transaktion.
export async function findUserByNameOn(
  client: PoolClient, username: string): Promise<User | undefined> {
  const { rows } = await client.query<User>(
    'SELECT user_id, username, password_hash FROM users WHERE username = $1',
    [username]);
  return rows[0];
}

export async function findUserById(id: number): Promise<User | undefined> {
  const { rows } = await pool.query<User>(
    'SELECT user_id, username, password_hash FROM users WHERE user_id = $1', [id]);
  return rows[0];
}

export async function findUserByIdOn(
  client: PoolClient, id: number): Promise<User | undefined> {
  const { rows } = await client.query<User>(
    'SELECT user_id, username, password_hash FROM users WHERE user_id = $1', [id]);
  return rows[0];
}

export async function createUserOn(client: PoolClient, username: string, hash: string): Promise<number> {
  const { rows } = await client.query<{ user_id: number }>(
    'SELECT create_user($1, $2) AS user_id', [username, hash]);
  return rows[0]!.user_id;
}

export async function changeUsername(id: number, username: string): Promise<boolean> {
  const result = await pool.query(
    'UPDATE users SET username = $2 WHERE user_id = $1', [id, username]);
  return result.rowCount === 1; // false hvis brugeren ikke findes
}

export async function deleteUser(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM users WHERE user_id = $1', [id]);
  return result.rowCount === 1; // Framework-tabeller bruger ON DELETE CASCADE
}
