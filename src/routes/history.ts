import { requireAuth } from "../middleware/auth.js";
import { Router } from "express";
import { findSearchHistoryEntry, findRatingHistoryEntry, getSearchHistory, getRatingHistory } from "../data/history.js";
import { NotFound } from "../middleware/errorHandler.js";
import { parsePositiveInteger, parsePagination } from "../validation.js";
import { toRatingHistoryDto, toSearchHistoryDto } from "./dto.js";
import { toPage } from "./pagination.js";

export const historyRouter = Router();
historyRouter.use(requireAuth);

historyRouter.get("/search", async (req, res) => {
    const pagination = parsePagination(req.query);
    const rows = await getSearchHistory(res.locals.userId, pagination);
    res.json(toPage(req, rows.map(toSearchHistoryDto), pagination));
});

historyRouter.get("/ratings", async (req, res) => {
    const pagination = parsePagination(req.query);
    const rows = await getRatingHistory(res.locals.userId, pagination);
    res.json(toPage(req, rows.map(toRatingHistoryDto), pagination));
});

historyRouter.get("/search/:searchId", async (req, res) => {
    const id = parsePositiveInteger(req.params.searchId, 0, "searchId");
    const entry = await findSearchHistoryEntry(res.locals.userId, id);
    if (!entry) throw new NotFound("Search history entry not found");
    res.json(toSearchHistoryDto(entry));
});

historyRouter.get("/ratings/:ratingId", async (req, res) => {
    const id = parsePositiveInteger(req.params.ratingId, 0, "ratingId");
    const entry = await findRatingHistoryEntry(res.locals.userId, id);
    if (!entry) throw new NotFound("Rating history entry not found");
    res.json(toRatingHistoryDto(entry));
});
