import {Router} from "express";
import {
    stringSearch, weightedSearch, similarMovies} from "../data/search.js";
export const searchRouter = Router();

searchRouter.get("/titles",async (reg,res,next) => {
    try {
        const searchString = reg.query.title;

        if (typeof searchString !== "string" || searchString.trim() === "") {
            res.status(400).json({
                error: "q must be a non-empty string"
            });
            return;
        }
//Virker kun med middleware giver det mening???
        const userId = res.locals.user.userId;

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