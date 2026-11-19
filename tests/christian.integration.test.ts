import { afterEach, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { pool } from '../src/db.js';
import { signToken } from '../src/auth/tokens.js';

process.env.JWT_SECRET = 'christian-integration-test-secret-at-least-32-chars';
afterEach(() => vi.restoreAllMocks());

it('uses structured filters and records the search under the authenticated identity', async () => {
    const rows = [{ tconst: 'tt0078748', primaryTitle: 'Alien' }];
    const query = vi.spyOn(pool, 'query').mockResolvedValue({ rows } as never);
    const response = await request(app).get('/api/search/structured')
        .auth(signToken(7), { type: 'bearer' })
        .query({ title: ' Alien ', plot: 'crew', character: 'Ripley', person: 'Weaver', userId: 99 })
        .expect(200).expect('Cache-Control', 'no-store');
    expect(response.body).toEqual(rows);
    expect(query).toHaveBeenCalledWith('SELECT * FROM public.structured_string_search($1, $2, $3, $4, $5)',
        [7, 'Alien', 'crew', 'Ripley', 'Weaver']);
});

it('rejects anonymous, empty and repeated structured search filters', async () => {
    const query = vi.spyOn(pool, 'query');
    await request(app).get('/api/search/structured?title=Alien').expect(401);
    await request(app).get('/api/search/structured?title=%20')
        .auth(signToken(7), { type: 'bearer' }).expect(400);
    await request(app).get('/api/search/structured?title=Alien&title=Aliens')
        .auth(signToken(7), { type: 'bearer' }).expect(400);
    expect(query).not.toHaveBeenCalled();
});

it.each([
    ['exact', 'SELECT * FROM public.exact_match_search($1)', []],
    ['best', 'SELECT * FROM public.best_match_search($1)', []],
    ['related', 'SELECT * FROM public.related_words($1, $2)', [10]],
])('runs the %s word search with normalized words', async (route, sql, extra) => {
    const rows = [{ result: route }];
    const query = vi.spyOn(pool, 'query').mockResolvedValue({ rows } as never);
    const response = await request(app).get(`/api/word-search/${route}`)
        .query({ words: ' space, , travel ' }).expect(200);
    expect(response.body).toEqual(rows);
    expect(query).toHaveBeenCalledWith(sql, [['space', 'travel'], ...extra]);
});

it('validates word search input and passes an explicit related word limit', async () => {
    const query = vi.spyOn(pool, 'query').mockResolvedValue({ rows: [] } as never);
    await request(app).get('/api/word-search/exact').expect(400);
    await request(app).get('/api/word-search/best?words=,%20,').expect(400);
    await request(app).get('/api/word-search/related?words=space&limit=2147483648').expect(400);
    expect(query).not.toHaveBeenCalled();
    await request(app).get('/api/word-search/related?words=space&limit=3').expect(200);
    expect(query).toHaveBeenCalledWith('SELECT * FROM public.related_words($1, $2)', [['space'], 3]);
});

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
