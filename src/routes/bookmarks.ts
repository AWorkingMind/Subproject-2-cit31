import { requireAuth } from "../middleware/auth.js";
import { Router } from "express";
import { bookmarkTitle, bookmarkPerson, findBookmark, getBookmarks, deleteBookmark } from "../data/bookmarks.js";
import { NotFound } from "../middleware/errorHandler.js";
import { parsePositiveInteger, parsePagination } from "../validation.js";
import { bookmarkUri, toBookmarkDto } from "./dto.js";
import { toPage } from "./pagination.js";

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

        const uri = bookmarkUri(bookmarkId);
        res.status(201).location(uri).json({ bookmark_id: bookmarkId, uri });
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

        const uri = bookmarkUri(bookmarkId);
        res.status(201).location(uri).json({ bookmark_id: bookmarkId, uri });
    } catch (err) {
        next(err);
    }
});

bookmarksRouter.get("/", async (req, res) => {
    const pagination = parsePagination(req.query);
    const rows = await getBookmarks(res.locals.userId, pagination);
    res.json(toPage(req, rows, pagination, toBookmarkDto));
});

bookmarksRouter.get("/:bookmarkId", async (req, res) => {
    const id = parsePositiveInteger(req.params.bookmarkId, 0, "bookmarkId");
    const bookmark = await findBookmark(res.locals.userId, id);
    if (!bookmark) throw new NotFound("Bookmark not found");
    res.json(toBookmarkDto(bookmark));
});
bookmarksRouter.delete("/:bookmarkId", async (req, res, next) => {
    try {
        const bookmarkId = Number(req.params.bookmarkId);
        const userId = res.locals.userId;

        if (!Number.isInteger(bookmarkId) || bookmarkId <= 0) {
            res.status(400).json({
                error: "bookmarkId must be a positive integer"
            });
            return;
        }

        const deleted = await deleteBookmark(userId, bookmarkId);

        if (!deleted) {
            res.status(404).json({
                error: "Bookmark not found"
            });
            return;
        }

        res.status(204).send();
    } catch (err) {
        next(err);
    }
});
