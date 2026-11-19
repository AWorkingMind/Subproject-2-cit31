import { Router } from "express";
import {
    findTitle,
    findTitleCredits,
    findTitles,
    DEFAULT_TITLE_PAGE_SIZE,
    MAX_TITLE_PAGE_SIZE
} from "../data/titles.js";
import { NotFound } from "../middleware/errorHandler.js";
import { toCreditDto, toTitleCollectionDto, toTitleDto } from "./dto.js";
import { parsePagination, parseTconst  } from "../validation.js";


const router = Router();

router.get("/", async (req, res) => {
    const { page, pageSize } = parsePagination(req.query, DEFAULT_TITLE_PAGE_SIZE, MAX_TITLE_PAGE_SIZE);

    const result = await findTitles(page, pageSize);
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

export default router;
