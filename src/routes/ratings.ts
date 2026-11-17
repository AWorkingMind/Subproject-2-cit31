import { Router } from "express";
import { rateTitle } from "../data/ratings.js";
import { parseRatingScore, parseTconst, parseUserId } from "../validation.js";

const router = Router();

router.put("/:userId/ratings/:tconst", async (req, res) => {
    const userId = parseUserId(req.params.userId);
    const tconst = parseTconst(req.params.tconst);
    const score = parseRatingScore(req.body);

    await rateTitle(userId, tconst, score);
    res.status(204).end();
});

export default router;
