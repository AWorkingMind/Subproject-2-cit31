import { requireAuth } from "../middleware/auth.js";
import { Router } from "express";
import {
    bestMatchSearch, exactMatchSearch, relatedWords, stringSearch, structuredSearch, weightedSearch, similarMovies} from "../data/search.js";
import { BadRequest } from "../middleware/errorHandler.js";
import { parsePagination, parsePositiveInteger, parseWordFilter } from "../validation.js";
import { MAX_DATABASE_LIMIT } from "../data/pagination.js";
import { toPage } from "./pagination.js";
import { toTitleReference, toWordReference } from "./dto.js";
export const searchRouter = Router();
export const wordSearchRouter = Router();

function parseWords(value: unknown): string[] {
    if (typeof value !== "string") {
        throw new BadRequest("words must contain at least one search word");
    }
    const words = value.split(",").map(word => word.trim()).filter(Boolean);
    if (words.length === 0) {
        throw new BadRequest("words must contain at least one search word");
    }
    return words;
}

wordSearchRouter.get("/exact", async (req, res) => {
    const pagination = parsePagination(req.query);
    const rows = await exactMatchSearch(parseWords(req.query.words), pagination);
    res.json(toPage(req, rows.map(toTitleReference), pagination));
});

wordSearchRouter.get("/best", async (req, res) => {
    const pagination = parsePagination(req.query);
    const rows = await bestMatchSearch(parseWords(req.query.words), pagination);
    res.json(toPage(req, rows.map(toTitleReference), pagination));
});

wordSearchRouter.get("/related", async (req, res) => {
    const words = parseWords(req.query.words);
    const word = parseWordFilter(req.query.word);
    const pagination = parsePagination(req.query, 10);
    const limit = parsePositiveInteger(req.query.limit, MAX_DATABASE_LIMIT, "limit");
    if (limit > MAX_DATABASE_LIMIT) {
        throw new BadRequest("limit must be a positive PostgreSQL integer");
    }
    const rows = await relatedWords(words, limit, word, pagination);
    const filters = { words: words.join(","), ...(req.query.limit === undefined ? {} : { limit: String(limit) }) };
    res.json(toPage(req, rows.map(row => toWordReference(row, "/api/word-search/related", filters)), pagination));
});

function parseSearchFilter(value: unknown, name: string): string | null {
    if (value === undefined) return null;
    if (typeof value !== "string") throw new BadRequest(`${name} must be a string`);
    return value.trim() || null;
}

searchRouter.get("/structured", requireAuth, async (req, res) => {
    const filters = {
        title: parseSearchFilter(req.query.title, "title"),
        plot: parseSearchFilter(req.query.plot, "plot"),
        character: parseSearchFilter(req.query.character, "character"),
        person: parseSearchFilter(req.query.person, "person"),
    };
    if (!Object.values(filters).some(Boolean)) {
        throw new BadRequest("At least one of title, plot, character or person is required");
    }

    const pagination = parsePagination(req.query);
    res.set("Cache-Control", "no-store");
    const rows = await structuredSearch(res.locals.userId, filters, pagination);
    res.json(toPage(req, rows.map(toTitleReference), pagination));
});

searchRouter.get("/titles", (req, res, next) => {
    if (req.headers.authorization) requireAuth(req, res, next);
    else next();
}, async (req, res) => {
    const searchString = req.query.title;
    if (typeof searchString !== "string" || searchString.trim() === "") {
        res.status(400).json({ error: "q must be a non-empty string" });
        return;
    }

    const pagination = parsePagination(req.query);
    const results = await stringSearch(res.locals.userId ?? null, searchString, pagination);
    res.json(toPage(req, results.map(toTitleReference), pagination));
});

searchRouter.get("/weighted", async (req, res) => {
    const words = parseWords(req.query.words);
    const pagination = parsePagination(req.query);
    const rows = await weightedSearch(words, pagination);
    res.json(toPage(req, rows.map(toTitleReference), pagination));
});

searchRouter.get("/similar/:tconst", async (req, res) => {
    const pagination = parsePagination(req.query);
    const limit = parsePositiveInteger(req.query.limit, MAX_DATABASE_LIMIT, "limit");
    if (limit > MAX_DATABASE_LIMIT) {
        throw new BadRequest("limit must be a positive PostgreSQL integer");
    }
    const results = await similarMovies(req.params.tconst, limit, pagination);
    res.json(toPage(req, results.map(toTitleReference), pagination));
});
