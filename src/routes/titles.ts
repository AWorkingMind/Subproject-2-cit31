import { Router } from "express";
import { findPopularActors, findTitle, findTitleCredits, findTitles } from "../data/titles.js";
import { NotFound } from "../middleware/errorHandler.js";
import { toCreditDto, toPersonReference, toTitleDto } from "./dto.js";
import { parsePagination, parseTconst } from "../validation.js";
import { toPage } from "./pagination.js";

const router = Router();
const DEFAULT_TITLE_PAGE_SIZE = 10;
const MAX_TITLE_PAGE_SIZE = 50;

router.get("/", async (req, res) => {
    const pagination = parsePagination(req.query, DEFAULT_TITLE_PAGE_SIZE, MAX_TITLE_PAGE_SIZE);

    const result = await findTitles(pagination);
    res.json(toPage(req, result, pagination, toTitleDto));
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
    const pagination = parsePagination(req.query);
    const title = await findTitle(tconst);

    if (!title) {
        throw new NotFound("Title not found");
    }

    const credits = await findTitleCredits(tconst, pagination);
    res.json(toPage(req, credits, pagination, toCreditDto));
});

router.get("/:tconst/actors", async (req, res) => {
    const tconst = parseTconst(req.params.tconst);
    const pagination = parsePagination(req.query);
    const title = await findTitle(tconst);
    if (!title) {
        throw new NotFound("Title not found");
    }

    const rows = await findPopularActors(tconst, pagination);
    res.json(toPage(req, rows, pagination, toPersonReference));
});

export default router;
