import { Router } from "express";
import { findPopularActors, findTitle, findTitleCredits, findTitles } from "../data/titles.js";
import { NotFound } from "../middleware/errorHandler.js";
import { toCreditDto, toTitleCollectionDto, toTitleDto } from "./dto.js";
import { parseTconst, parseTitlePagination } from "../validation.js";

const router = Router();

router.get("/", async (req, res) => {
    const { page, pageSize } = parseTitlePagination(req.query);

    const result = await findTitles(page);
    const dto = toTitleCollectionDto(result.items, page, pageSize, result.hasNextPage);
    res.status(200).json(dto);
});

router.get("/:tconst", async (req, res) => {
    const tconst = parseTconst(req.params.tconst);
    const title = await findTitle(tconst);

    if (!title) {
        throw new NotFound("Title not found");
    }

    const dto = toTitleDto(title);

    res.status(200).json(dto);
});

router.get("/:tconst/credits", async (req, res) => {
    const tconst = parseTconst(req.params.tconst);
    const title = await findTitle(tconst);

    if (!title) {
        throw new NotFound("Title not found");
    }

    const credits = await findTitleCredits(tconst);
    const dto = credits.map(toCreditDto);

    res.status(200).json(dto);
});

router.get("/:tconst/actors", async (req, res) => {
    const tconst = parseTconst(req.params.tconst);
    const title = await findTitle(tconst);
    if (!title) {
        throw new NotFound("Title not found");
    }

    res.json(await findPopularActors(tconst));
});

export default router;
