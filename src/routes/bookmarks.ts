import { requireAuth } from "../middleware/auth.js";
import { Router } from "express";
import {bookmarkTitle, bookmarkPerson, getBookmarks} from "../data/bookmarks.js";

export const bookmarksRouter = Router();
bookmarksRouter.use(requireAuth);

bookmarksRouter.post("/titles/:tconst", async (req, res, next) => {
    try {
        const tconst = req.params.tconst;
        const userId = res.locals.userId;
        //har behov for middlewear for at virke

        if (typeof tconst !== "string" || tconst.trim() === "") {
            res.status(400).json({
                error: "tconst must be a non-empty string"
            });
            return;
        }

        const bookmarkId = await bookmarkTitle(userId, tconst);

        res.status(201).json({
            bookmark_id: bookmarkId
        });
    } catch (err) {
        next(err);
    }
});
bookmarksRouter.post("/people/:nconst", async (req, res, next) => {
    try {
        const nconst = req.params.nconst;
        const userId = res.locals.userId;

        if (typeof nconst !== "string" || nconst.trim() === "") {
            res.status(400).json({
                error: "nconst must be a non-empty string"
            });
            return;
        }

        const bookmarkId = await bookmarkPerson(userId, nconst);

        res.status(201).json({
            bookmark_id: bookmarkId
        });
    } catch (err) {
        next(err);
    }
});

bookmarksRouter.get("/", async (req, res, next) => {
    try {
        const userId = res.locals.userId;

        const bookmarks = await getBookmarks(userId);

        res.json(bookmarks);
    } catch (err) {
        next(err);
    }
});