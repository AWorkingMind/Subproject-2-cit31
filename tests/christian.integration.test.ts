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
    expect(response.body.items).toEqual([{ ...rows[0], uri: '/api/titles/tt0078748' }]);
    expect(query).toHaveBeenCalledWith('SELECT * FROM public.structured_string_search($1, $2, $3, $4, $5) ORDER BY "primaryTitle", tconst LIMIT $6 OFFSET $7',
        [7, 'Alien', 'crew', 'Ripley', 'Weaver', 21, 0]);
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
    ['exact', 'SELECT * FROM public.exact_match_search($1) ORDER BY "primaryTitle", tconst LIMIT $2 OFFSET $3', [21, 0]],
    ['best', 'SELECT * FROM public.best_match_search($1) ORDER BY matched_words DESC, "primaryTitle", tconst LIMIT $2 OFFSET $3', [21, 0]],
    ['related', 'SELECT * FROM public.related_words($1, $2) WHERE ($3::text IS NULL OR word = $3) ORDER BY frequency DESC, word LIMIT $4 OFFSET $5', [2147483647, null, 11, 0]],
])('runs the %s word search with normalized words', async (route, sql, extra) => {
    const row = route === 'related'
        ? { word: 'space', frequency: '10' }
        : { tconst: 'tt0078748', primaryTitle: 'Alien' };
    const uri = route === 'related'
        ? '/api/word-search/related?words=space%2Ctravel&word=space'
        : '/api/titles/tt0078748';
    const rows = [row];
    const query = vi.spyOn(pool, 'query').mockResolvedValue({ rows } as never);
    const response = await request(app).get(`/api/word-search/${route}`)
        .query({ words: ' space, , travel ' }).expect(200);
    expect(response.body.items).toEqual([{ ...row, uri }]);
    expect(query).toHaveBeenCalledWith(sql, [['space', 'travel'], ...extra]);
});

it('validates word search input and passes an explicit related word limit', async () => {
    const query = vi.spyOn(pool, 'query').mockResolvedValue({ rows: [] } as never);
    await request(app).get('/api/word-search/exact').expect(400);
    await request(app).get('/api/word-search/best?words=,%20,').expect(400);
    await request(app).get('/api/word-search/related?words=space&limit=2147483648').expect(400);
    expect(query).not.toHaveBeenCalled();
    await request(app).get('/api/word-search/related?words=space&limit=3').expect(200);
    expect(query).toHaveBeenCalledWith('SELECT * FROM public.related_words($1, $2) WHERE ($3::text IS NULL OR word = $3) ORDER BY frequency DESC, word LIMIT $4 OFFSET $5', [['space'], 3, null, 11, 0]);
});

it('preserves the search filter and page size in links to adjacent pages', async () => {
    const query = vi.spyOn(pool, 'query').mockResolvedValue({
        rows: [{ tconst: 'tt0000001' }, { tconst: 'tt0078748' }, { tconst: 'tt0090605' }],
    } as never);
    const response = await request(app).get('/api/word-search/exact')
        .query({ words: 'space,travel', page: 2, pageSize: 1 }).expect(200);
    expect(response.body).toMatchObject({
        items: [{ tconst: 'tt0078748', uri: '/api/titles/tt0078748' }],
        page: 2,
        pageSize: 1,
        hasNextPage: true,
    });
    for (const [uri, page] of [[response.body.prevPageUri, '1'], [response.body.nextPageUri, '3']]) {
        const link = new URL(uri);
        expect(link.pathname).toBe('/api/word-search/exact');
        expect(Object.fromEntries(link.searchParams)).toEqual({ words: 'space,travel', page, pageSize: '1' });
    }
    expect(query).toHaveBeenCalledWith(expect.stringContaining('LIMIT $2 OFFSET $3'), [['space', 'travel'], 3, 0]);
});

it('links back from an empty page only if the previous page exists', async () => {
    vi.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rows: [{ tconst: 'tt0078748' }] } as never)
        .mockResolvedValueOnce({ rows: [] } as never);
    const adjacent = await request(app).get('/api/word-search/exact?words=space&page=2&pageSize=2').expect(200);
    expect(adjacent.body).toMatchObject({ items: [], nextPageUri: null });
    expect(new URL(adjacent.body.prevPageUri).searchParams.get('page')).toBe('1');

    const distant = await request(app).get('/api/word-search/exact?words=space&page=99&pageSize=2').expect(200);
    expect(distant.body).toMatchObject({ items: [], prevPageUri: null, nextPageUri: null });
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
    query.mockResolvedValueOnce({ rows: [{ user_id: 7, username: 'test-user' }] } as never);
    const token = signToken(7);
    const profile = await request(app).get('/api/users/7').auth(token, { type: 'bearer' }).expect(200);
    for (const [path, sql] of [
        [profile.body.bookmarksUri, 'SELECT * FROM get_bookmarks($1) ORDER BY created_at DESC, bookmark_id DESC LIMIT $2 OFFSET $3'],
        [profile.body.searchHistoryUri, 'SELECT * FROM get_search_history($1) ORDER BY searched_at DESC, search_id DESC LIMIT $2 OFFSET $3'],
        [profile.body.ratingHistoryUri, 'SELECT * FROM get_rating_history($1) ORDER BY rated_at DESC, rating_id DESC LIMIT $2 OFFSET $3'],
    ]) {
        await request(app).get(path).auth(token, { type: 'bearer' }).expect(200);
        expect(query).toHaveBeenLastCalledWith(sql, [7, 21, 0]);
    }
});

it('creates a bookmark for the authenticated user', async () => {
    const query = vi.spyOn(pool, 'query').mockResolvedValue({ rows: [{ bookmark_title: 42 }] } as never);
    const res = await request(app).post('/api/bookmarks/titles/tt11051918').auth(signToken(7), { type: 'bearer' });
    expect(res.status).toBe(201);
    expect(res.body.bookmark_id).toBe(42);
    expect(res.body.uri).toBe('/api/bookmarks/42');
    expect(res.headers.location).toBe(res.body.uri);
    expect(query).toHaveBeenCalledWith('SELECT bookmark_title($1, $2)', [7, 'tt11051918']);
});

it('routes person search before the person-id route', async () => {
    const query = vi.spyOn(pool, 'query').mockResolvedValue({ rows: [] } as never);
    expect((await request(app).get('/api/people/search?name=Tom')).status).toBe(200);
    expect(query).toHaveBeenCalledWith('SELECT * FROM public.person_search($1) ORDER BY "primaryName", nconst LIMIT $2 OFFSET $3', ['Tom', 21, 0]);
});

it('uses the login identity for search history and allows anonymous search', async () => {
    const query = vi.spyOn(pool, 'query').mockResolvedValue({ rows: [] } as never);
    expect((await request(app).get('/api/search/titles?title=Alien').auth(signToken(7), { type: 'bearer' })).status).toBe(200);
    expect(query).toHaveBeenLastCalledWith('SELECT * FROM public.string_search($1, $2) ORDER BY "primaryTitle", tconst LIMIT $3 OFFSET $4', [7, 'Alien', 21, 0]);
    expect((await request(app).get('/api/search/titles?title=Alien')).status).toBe(200);
    expect(query).toHaveBeenLastCalledWith(expect.stringContaining('FROM public.title'), ['Alien', 21, 0]);
});

it('rejects invalid bookmark and similarity route parameters before querying the database', async () => {
    const query = vi.spyOn(pool, 'query').mockResolvedValue({ rows: [] } as never);
    const api = request(app);
    const token = signToken(7);
    const responses = await Promise.all([
        api.post('/api/bookmarks/titles/invalid').auth(token, { type: 'bearer' }),
        api.post('/api/bookmarks/people/invalid').auth(token, { type: 'bearer' }),
        api.get('/api/search/similar/invalid'),
        api.get('/api/bookmarks/1e2').auth(token, { type: 'bearer' }),
        api.delete('/api/bookmarks/1e2').auth(token, { type: 'bearer' }),
    ]);
    for (const response of responses) {
        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ status: 400, error: 'Bad Request' });
    }
    expect(query).not.toHaveBeenCalled();
});
