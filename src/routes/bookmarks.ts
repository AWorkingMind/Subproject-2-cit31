import { requireAuth } from "../middleware/auth.js";
import { Router } from "express";
import { bookmarkTitle, bookmarkPerson, findBookmark, getBookmarks, deleteBookmark } from "../data/bookmarks.js";
import { NotFound } from "../middleware/errorHandler.js";
import { parseNconst, parsePagination, parsePositiveInteger, parseTconst } from "../validation.js";
import { bookmarkUri, toBookmarkDto } from "./dto.js";
import { toPage } from "./pagination.js";

export const bookmarksRouter = Router();
bookmarksRouter.use(requireAuth);

bookmarksRouter.post("/titles/:tconst", async (req, res, next) => {
    try {
        const tconst = parseTconst(req.params.tconst);
        const userId = res.locals.userId;

        const bookmarkId = await bookmarkTitle(userId, tconst);

        const uri = bookmarkUri(bookmarkId);
        res.status(201).location(uri).json({ bookmark_id: bookmarkId, uri });
    } catch (err) {
        next(err);
    }
});
bookmarksRouter.post("/people/:nconst", async (req, res, next) => {
    try {
        const nconst = parseNconst(req.params.nconst);
        const userId = res.locals.userId;

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
        const bookmarkId = parsePositiveInteger(req.params.bookmarkId, 0, "bookmarkId");
        const userId = res.locals.userId;

        const deleted = await deleteBookmark(userId, bookmarkId);

        if (!deleted) {
            throw new NotFound("Bookmark not found");
        }

        res.status(204).send();
    } catch (err) {
        next(err);
    }
});
