import { beforeEach, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { hashPassword, validPassword, verifyPassword } from '../src/auth/passwords.js';
import { signToken, verifyToken } from '../src/auth/tokens.js';
import { userDto } from '../src/services/users.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { findUserById, changePassword, changeUsername } from '../src/data/users.js';

vi.mock('../src/data/users.js', () => ({
  findUserById: vi.fn(),
  changePassword: vi.fn(),
  changeUsername: vi.fn()
}));

process.env.JWT_SECRET = 'this-is-an-example-secret-used-only-for-tests-12345'; // Kun test

describe('Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hash og adgangskode', async () => {
    const hash = await hashPassword('en-test-kode');
    expect(hash).not.toBe('en-test-kode');
    expect(await verifyPassword('en-test-kode', hash)).toBe(true);
    expect(await verifyPassword('forkert', hash)).toBe(false);
  });

  it('ny adgangskode skal have bogstav og tal', () => {
    expect(validPassword('kodeuden1')).toBe(true);
    expect(validPassword('kunbogstaver')).toBe(false);
    expect(validPassword('12345678')).toBe(false);
    expect(validPassword('Æble1234')).toBe(true);
  });

  it('token kan oprettes og kontrolleres', () => {
    const token = signToken(7);
    expect(verifyToken(token)?.userId).toBe(7);
    expect(verifyToken('forkert')).toBeUndefined();
  });

  it('accepterer ikke hemmeligheden fra env-eksemplet', () => {
    const secret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'SKIFT_DENNE_TIL_EN_LANG_TILFAELDIG_HEMMELIG_NOEGLE';
    expect(() => signToken(7)).toThrow('JWT_SECRET');
    expect(() => verifyToken('forkert')).toThrow('JWT_SECRET');
    process.env.JWT_SECRET = secret;
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

  it('403 når man beder om en anden brugers konto', async () => {
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

  it('400 for ugyldig registrering uden databasekald', async () => {
    const res = await request(app).post('/api/users').send({ username: 'sandra' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Bad Request');
  });

  it('401 for ændring af adgangskode uden token', async () => {
    const res = await request(app).patch('/api/users/7').send({
      currentPassword: 'gammel123', newPassword: 'nykode123'
    });
    expect(res.status).toBe(401);
  });

  it('403 for ændring af en anden brugers adgangskode', async () => {
    const token = signToken(7);
    const res = await request(app).patch('/api/users/9')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'gammel123', newPassword: 'nykode123' });
    expect(res.status).toBe(403);
  });

  it('400 når en af adgangskoderne mangler', async () => {
    const token = signToken(7);
    const res = await request(app).patch('/api/users/7')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'gammel123' });
    expect(res.status).toBe(400);
  });

  it('400 når den nye adgangskode mangler', async () => {
    const token = signToken(7);
    const res = await request(app).patch('/api/users/7')
      .set('Authorization', `Bearer ${token}`)
      .send({ newPassword: 'nykode123' });
    expect(res.status).toBe(400);
  });

  it('400 når ny adgangskode ikke har tal eller bogstav', async () => {
    const token = signToken(7);
    const res = await request(app).patch('/api/users/7')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'gammel123', newPassword: 'kunbogstaver' });
    expect(res.status).toBe(400);
  });

  it('ændrer adgangskode med den rigtige gamle adgangskode', async () => {
    const oldHash = await hashPassword('gammel123');
    vi.mocked(findUserById).mockResolvedValue({
      user_id: 7, username: 'sandra', password_hash: oldHash
    });
    vi.mocked(changePassword).mockResolvedValue(true);

    const token = signToken(7);
    const res = await request(app).patch('/api/users/7')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'gammel123', newPassword: 'nykode123' });

    expect(res.status).toBe(200);
    const hash = vi.mocked(changePassword).mock.calls[0][1];
    expect(await verifyPassword('nykode123', hash)).toBe(true);
  });

  it('afviser forkert gammel adgangskode', async () => {
    const oldHash = await hashPassword('gammel123');
    vi.mocked(findUserById).mockResolvedValue({
      user_id: 7, username: 'sandra', password_hash: oldHash
    });

    const token = signToken(7);
    const res = await request(app).patch('/api/users/7')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'forkert123', newPassword: 'nykode123' });
    expect(res.status).toBe(401);
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('bevarer opdatering af brugernavn', async () => {
    vi.mocked(changeUsername).mockResolvedValue(true);
    vi.mocked(findUserById).mockResolvedValue({
      user_id: 7, username: 'nyt-navn', password_hash: 'hash'
    });

    const token = signToken(7);
    const res = await request(app).patch('/api/users/7')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'nyt-navn' });
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('nyt-navn');
  });

  it('afviser at ændre brugernavn og adgangskode på én gang', async () => {
    const token = signToken(7);
    const res = await request(app).patch('/api/users/7')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'nyt-navn', currentPassword: 'gammel123', newPassword: 'nykode123'
      });
    expect(res.status).toBe(400);
  });

  it('409 for create_user sin duplicate-fejl', () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    errorHandler(
      { code: 'P0001', message: 'Username already exists' },
      {} as never, { status, json } as never, (() => undefined) as never);
    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      status: 409, error: 'Conflict', message: 'Username already exists'
    }));
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
