import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";
import { DatabaseError } from "pg";
import app from "../src/app.ts";
import { pool } from "../src/db.ts";

import { signToken } from "../src/auth/tokens.ts";
process.env.JWT_SECRET = "ratings-test-secret-with-at-least-32-characters";

test("ratings endpoint", async (t) => {
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const baseUrl = `http://127.0.0.1:${server.address().port}/api/users`;
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
        server.closeAllConnections();
    }));

    async function put(path, body) {
        return fetch(`${baseUrl}/${path}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${signToken(1)}` },
            body: JSON.stringify(body),
        });
    }

    await t.test("rejects missing tokens and another user's ratings", async (t) => {
        t.mock.method(pool, "query", async () => assert.fail("Unexpected database call"));
        const missing = await fetch(baseUrl + "/1/ratings/tt11051918", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({score: 8}) });
        assert.equal(missing.status, 401);
        assert.equal((await put("2/ratings/tt11051918", {score: 8})).status, 403);
    });

    await t.test("create and replace ratings using parameterized calls", async (t) => {
        const calls = [];
        t.mock.method(pool, "query", async (...args) => { calls.push(args); return { rows: [] }; });
        for (const score of [1, 10]) {
            const response = await put("1/ratings/tt11051918", { score });
            assert.equal(response.status, 204);
            assert.equal(await response.text(), "");
        }
        assert.deepEqual(calls, [
            ["SELECT public.rate($1, $2, $3)", [1, "tt11051918", 1]],
            ["SELECT public.rate($1, $2, $3)", [1, "tt11051918", 10]],
        ]);
    });

    await t.test("invalid input never reaches the database", async (t) => {
        t.mock.method(pool, "query", async () => assert.fail("Unexpected database call"));
        for (const body of [{}, null, [], { score: "8" }, { score: null }, { score: 0 }, { score: 11 }, { score: 1.5 }]) {
            const response = await put("1/ratings/tt11051918", body);
            assert.equal(response.status, 400);
            assert.equal((await response.json()).error, "Bad Request");
        }
        for (const path of ["0/ratings/tt11051918", "abc/ratings/tt11051918", "2147483648/ratings/tt11051918", "1/ratings/tt123", "1/ratings/nm0000001"]) {
            assert.equal((await put(path, { score: 8 })).status, 400);
        }
        const malformed = await fetch(`${baseUrl}/1/ratings/tt11051918`, {
            method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${signToken(1)}` }, body: "{",
        });
        assert.equal(malformed.status, 400);
    });

    for (const [code, constraint, status, message] of [
        ["23503", "fk_rating_history_user", 404, "User not found"],
        ["23503", "fk_rating_history_title", 404, "Title not found"],
        ["23505", "uq_rating_history_user_title", 409, "Rating was changed concurrently; retry the request"],
    ]) {
        await t.test(constraint, async (t) => {
            const error = new DatabaseError("Database details", 0, "error");
            error.code = code;
            error.constraint = constraint;
            t.mock.method(pool, "query", async () => { throw error; });
            const response = await put("1/ratings/tt11051918", { score: 8 });
            assert.equal(response.status, status);
            assert.equal((await response.json()).message, message);
        });
    }

    await t.test("unexpected errors remain generic server errors", async (t) => {
        t.mock.method(console, "error", () => {});
        t.mock.method(pool, "query", async () => { throw new Error("Private database details"); });
        const response = await put("1/ratings/tt11051918", { score: 8 });
        assert.equal(response.status, 500);
        assert.equal((await response.json()).message, "Internal error");
    });
});
