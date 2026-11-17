import { afterEach, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { pool } from '../src/db.js';
import { signToken } from '../src/auth/tokens.js';

process.env.JWT_SECRET = 'christian-integration-test-secret-at-least-32-chars';
afterEach(() => vi.restoreAllMocks());

it('protects bookmarks and history before accessing the database', async () => {
    const query = vi.spyOn(pool, 'query');
    for (const path of ['/api/bookmarks', '/api/history/search', '/api/history/ratings']) {
        expect((await request(app).get(path)).status).toBe(401);
    }
    expect(query).not.toHaveBeenCalled();
});

it('passes the logged-in user to bookmarks and history queries', async () => {
    const query = vi.spyOn(pool, 'query').mockResolvedValue({ rows: [] } as never);
    for (const [path, sql] of [
        ['/api/bookmarks', 'SELECT * FROM get_bookmarks($1)'],
        ['/api/history/search', 'SELECT * FROM get_search_history($1)'],
        ['/api/history/ratings', 'SELECT * FROM get_rating_history($1)'],
    ]) {
        expect((await request(app).get(path).auth(signToken(7), { type: 'bearer' })).status).toBe(200);
        expect(query).toHaveBeenLastCalledWith(sql, [7]);
    }
});

it('creates a bookmark for the authenticated user', async () => {
    const query = vi.spyOn(pool, 'query').mockResolvedValue({ rows: [{ bookmark_title: 42 }] } as never);
    const res = await request(app).post('/api/bookmarks/titles/tt11051918').auth(signToken(7), { type: 'bearer' });
    expect(res.status).toBe(201);
    expect(res.body.bookmark_id).toBe(42);
    expect(query).toHaveBeenCalledWith('SELECT bookmark_title($1, $2)', [7, 'tt11051918']);
});

it('routes person search before the person-id route', async () => {
    const query = vi.spyOn(pool, 'query').mockResolvedValue({ rows: [] } as never);
    expect((await request(app).get('/api/people/search?name=Tom')).status).toBe(200);
    expect(query).toHaveBeenCalledWith('SELECT * FROM person_search($1)', ['Tom']);
});

it('uses the login identity for search history and allows anonymous search', async () => {
    const query = vi.spyOn(pool, 'query').mockResolvedValue({ rows: [] } as never);
    expect((await request(app).get('/api/search/titles?title=Alien').auth(signToken(7), { type: 'bearer' })).status).toBe(200);
    expect(query).toHaveBeenLastCalledWith('SELECT * FROM string_search($1,$2)', [7, 'Alien']);
    expect((await request(app).get('/api/search/titles?title=Alien')).status).toBe(200);
    expect(query).toHaveBeenLastCalledWith('SELECT * FROM string_search($1,$2)', [null, 'Alien']);
});
