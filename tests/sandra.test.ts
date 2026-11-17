import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { hashPassword, verifyPassword } from '../src/auth/passwords.js';
import { signToken, verifyToken } from '../src/auth/tokens.js';
import { userDto } from '../src/services/users.js';

process.env.JWT_SECRET = 'this-is-an-example-secret-used-only-for-tests-12345'; // Kun test

describe('Person 3', () => {
  it('hash og adgangskode', async () => {
    const hash = await hashPassword('en-test-kode');
    expect(hash).not.toBe('en-test-kode');
    expect(await verifyPassword('en-test-kode', hash)).toBe(true);
    expect(await verifyPassword('forkert', hash)).toBe(false);
  });

  it('token kan oprettes og kontrolleres', () => {
    const token = signToken(7);
    expect(verifyToken(token)?.userId).toBe(7);
    expect(verifyToken('forkert')).toBeUndefined();
  });

  it('bruger-DTO indeholder URIer, men aldrig password-hash', () => {
    const result = userDto({ user_id: 7, username: 'sandra' });
    expect(result).toEqual({
      uri: '/api/users/7',
      username: 'sandra',
      bookmarksUri: '/api/users/7/bookmarks',
      searchHistoryUri: '/api/users/7/search-history',
      ratingHistoryUri: '/api/users/7/ratings'
    });
    expect(result).not.toHaveProperty('password_hash');
  });

  it('401 uden token, med de fire fejl-felter', async () => {
    const res = await request(app).get('/api/users/7');
    expect(res.status).toBe(401);
    expect(Object.keys(res.body).sort()).toEqual(['error','message','status','timestamp']);
  });

  it('403 naar man beder om en anden brugers konto', async () => {
    const token = signToken(7);
    const res = await request(app).get('/api/users/9').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403); // Stopper før databasen bliver brugt
  });

  it('400 for et ugyldigt bruger-id efter token-check', async () => {
    const token = signToken(7);
    const res = await request(app).get('/api/users/0').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ status: 400, error: 'Bad Request' });
  });

  it('404 for en rute, som ikke findes', async () => {
    const res = await request(app).get('/api/ukendt');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });

  it('400 for ugyldig JSON', async () => {
    const res = await request(app).post('/api/auth/login')
      .set('Content-Type', 'application/json').send('{');
    expect(res.status).toBe(400);
    expect(res.body.status).toBe(400);
  });

  it('CORS sender header til frontend', async () => {
    const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
    const res = await request(app).options('/api/users')
      .set('Origin', origin).set('Access-Control-Request-Method', 'POST');
    expect(res.headers['access-control-allow-origin']).toBe(origin);
  });

  it('CORS afviser en anden origin', async () => {
    const res = await request(app).get('/api/ukendt').set('Origin', 'http://ikke-tilladt.test');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
