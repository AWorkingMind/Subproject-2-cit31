import { describe, it, expect, afterAll } from 'vitest';
import { pool } from '../src/db.js';
import { createUserOn, findUserByIdOn, findUserByNameOn } from '../src/data/users.js';

// Koeres kun naar den rigtige adgangskode er sat i .env.
const enabled = Boolean(process.env.DB_PASSWORD)
  && process.env.DB_PASSWORD !== 'DIT_PASSWORD';

describe.skipIf(!enabled)('Data access med rollback (2-E.2)', () => {
  it('laeser og skriver i en transaktion, som rulles tilbage', async () => {
    const client = await pool.connect(); // Samme forbindelse hele vejen
    const name = 'test-sandra-' + Date.now();
    let transactionStarted = false;
    try {
      await client.query('BEGIN');
      transactionStarted = true;
      const id = await createUserOn(client, name, 'kun-en-test-hash');
      const user = await findUserByIdOn(client, id);
      expect(user?.username).toBe(name);

      await client.query('ROLLBACK');
      transactionStarted = false;
      expect(await findUserByNameOn(client, name)).toBeUndefined(); // Tjekker at testen ikke gemte noget
    } finally {
      if (transactionStarted) await client.query('ROLLBACK');
      client.release();
    }
  });
});

afterAll(async () => {
  await pool.end();
});
