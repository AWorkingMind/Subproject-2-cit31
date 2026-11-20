import { requireAuth } from "../middleware/auth.js";
import { Router } from "express";
import { bookmarkTitle, bookmarkPerson, findBookmark, getBookmarks, deleteBookmark } from "../data/bookmarks.js";
import { BadRequest, NotFound } from "../middleware/errorHandler.js";
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
            throw new BadRequest("tconst must be a non-empty string");
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
            throw new BadRequest("nconst must be a non-empty string");
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
            throw new BadRequest("bookmark must be a positiv intiger");
        }

        const deleted = await deleteBookmark(userId, bookmarkId);

        if (!deleted) {
            throw new NotFound("Bookmark not found");
        }

        res.status(204).send();
    } catch (err) {
        next(err);
    }
});
