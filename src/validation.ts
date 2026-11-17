import { BadRequest } from "./middleware/errorHandler.js";
import { TITLE_PAGE_SIZE } from "./data/titles.js";
import { CO_PLAYERS_PAGE_SIZE, PEOPLE_PAGE_SIZE } from "./data/people.js";

export function parseNconst(value: string): string {
    if (!/^nm[0-9]{7,8}$/.test(value)) {
        throw new BadRequest("nconst must start with nm followed by 7 or 8 digits");
    }
    return value;
}

export function parseTconst(value: string): string {
    if (!/^tt[0-9]{7,8}$/.test(value)) {
        throw new BadRequest("tconst must start with tt followed by 7 or 8 digits");
    }
    return value;
}

export function parseUserId(value: string): number {
    if (!/^[0-9]+$/.test(value)) {
        throw new BadRequest("userId must be a positive integer");
    }
    const userId = Number(value);
    if (!Number.isInteger(userId) || userId < 1 || userId > 2147483647) {
        throw new BadRequest("userId must be a positive PostgreSQL integer");
    }
    return userId;
}

export function parseRatingScore(body: unknown): number {
    if (typeof body !== "object" || body === null || Array.isArray(body) || !("score" in body)) {
        throw new BadRequest("Request body must contain score");
    }
    const score = body.score;
    if (typeof score !== "number" || !Number.isInteger(score) || score < 1 || score > 10) {
        throw new BadRequest("score must be an integer between 1 and 10");
    }
    return score;
}

export function parsePositiveInteger(value: unknown, fallback: number, name: string): number {
    if (value === undefined) return fallback;

    if (typeof value !== "string" || !/^[0-9]+$/.test(value)) {
        throw new BadRequest(`${name} must be a positive integer`);
    }

    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 1) {
        throw new BadRequest(`${name} must be a positive integer`);
    }

    return parsed;
}

export function parseTitlePagination(query: { page?: unknown; pageSize?: unknown }) {
    return parsePagination(query, TITLE_PAGE_SIZE);
}

export function parsePeoplePagination(query: { page?: unknown; pageSize?: unknown }) {
    return parsePagination(query, PEOPLE_PAGE_SIZE);
}

export function parseCoPlayerPagination(query: { page?: unknown; pageSize?: unknown }) {
    return parsePagination(query, CO_PLAYERS_PAGE_SIZE);
}

function parsePagination(query: { page?: unknown; pageSize?: unknown }, fixedPageSize: number) {
    const page = parsePositiveInteger(query.page, 1, "page");
    const pageSize = parsePositiveInteger(query.pageSize, fixedPageSize, "pageSize");

    if (pageSize !== fixedPageSize) {
        throw new BadRequest(`pageSize is fixed at ${fixedPageSize}`);
    }
    if (!Number.isSafeInteger((page - 1) * pageSize)) {
        throw new BadRequest("Requested page is too large");
    }

    return { page, pageSize };
}
