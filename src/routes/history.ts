import { requireAuth } from "../middleware/auth.js";
import { Router } from "express";
import {getSearchHistory, getRatingHistory} from "../data/history.js";

export const historyRouter = Router();
historyRouter.use(requireAuth);

historyRouter.get("/search", async (req, res, next) => {
    try {
        const userId = res.locals.userId;

        const history = await getSearchHistory(userId);

        res.json(history);
    } catch (err) {
        next(err);
    }
});

historyRouter.get("/ratings", async (req, res, next) => {
    try {
        const userId = res.locals.userId;

        const history = await getRatingHistory(userId);

        res.json(history);
    } catch (err) {
        next(err);
    }
});