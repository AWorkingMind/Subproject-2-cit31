import { requireAuth } from "../middleware/auth.js";
import {Router} from "express";
import {
    bestMatchSearch, exactMatchSearch, relatedWords, stringSearch, structuredSearch, weightedSearch, similarMovies} from "../data/search.js";
import { BadRequest } from "../middleware/errorHandler.js";
import { parsePositiveInteger } from "../validation.js";
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
    res.json(await exactMatchSearch(parseWords(req.query.words)));
});

wordSearchRouter.get("/best", async (req, res) => {
    res.json(await bestMatchSearch(parseWords(req.query.words)));
});

wordSearchRouter.get("/related", async (req, res) => {
    const words = parseWords(req.query.words);
    const limit = parsePositiveInteger(req.query.limit, 10, "limit");
    if (limit > 2147483647) {
        throw new BadRequest("limit must be a positive PostgreSQL integer");
    }
    res.json(await relatedWords(words, limit));
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

    res.set("Cache-Control", "no-store");
    res.json(await structuredSearch(res.locals.userId, filters));
});

searchRouter.get("/titles", (req, res, next) => {
    if (req.headers.authorization) requireAuth(req, res, next);
    else next();
}, async (reg,res,next) => {
    try {
        const searchString = reg.query.title;

        if (typeof searchString !== "string" || searchString.trim() === "") {
            res.status(400).json({
                error: "q must be a non-empty string"
            });
            return;
        }
//Virker kun med middleware giver det mening???
        const userId = res.locals.userId ?? null;

        const results = await stringSearch(userId, searchString)

        res.json(results);
        //Dette skal videre gives til en centraliseret error håndterings middleware
} catch (err){
    next(err);
    }
});

searchRouter.get("/weighted", async (req, res, next) => {
    try {
        const wordsParam = req.query.words;

        if (typeof wordsParam !== "string" || wordsParam.trim() === "") {
            res.status(400).json({
                error: "words must be a non-empty string"
            });
            return;
        }

        //Sørger for der er fordeling ved kommaer samt at ingen mellemrum bliver godtaget
        const words = wordsParam
            .split(",")
            .map(word => word.trim())
            .filter(word => word !== "");

        const results = await weightedSearch(words);

        res.json(results);
    } catch (err) {
        next(err);
    }
});

searchRouter.get("/similar/:tconst", async (req, res, next) => {
    try {
        const tconst = req.params.tconst;
        const limitParam = req.query.limit;
//Der er en limit som brugeren kan bestemme, det er fordi dette er et project krav!
        let limit = 20;

        if (typeof limitParam === "string") {
            const parsedLimit = Number(limitParam);

            if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
                res.status(400).json({
                    error: "limit must be a positive integer"
                });
                return;
            }

            limit = parsedLimit;
        }

        const results = await similarMovies(tconst, limit);

        res.json(results);
    } catch (err) {
        next(err);
    }
});
