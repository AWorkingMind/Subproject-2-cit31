import { Router } from "express";
import { rateTitle } from "../data/ratings.js";
import { parseRatingScore, parseTconst, parseUserId } from "../validation.js";

import { requireAuth, requireOwnUser } from "../middleware/auth.js";

const router = Router();

router.put<{ id: string; tconst: string }>("/:id/ratings/:tconst", requireAuth, (req, _res, next) => {
    parseUserId(req.params.id);
    next();
}, requireOwnUser, async (req, res) => {
    const userId = parseUserId(req.params.id);
    const tconst = parseTconst(req.params.tconst);
    const score = parseRatingScore(req.body);

    await rateTitle(userId, tconst, score);
    res.status(204).end();
});

export default router;
