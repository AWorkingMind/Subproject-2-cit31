import { Router } from "express";
import {
    findCoPlayers,
    findPeople,
    findPerson,
    findPersonWords,
    personSearch
} from "../data/people.js";
import { BadRequest, NotFound } from "../middleware/errorHandler.js";
import { parsePagination, parseNconst, parseWordFilter } from "../validation.js";
import { toCoPlayerCollectionDto, toPersonCollectionDto, toPersonDto, toPersonReference, toWordReference } from "./dto.js";
import { paginationLinks, toPage } from "./pagination.js";

const router = Router();

router.get("/", async (req, res) => {
    const { page, pageSize } = parsePagination(req.query);
    const result = await findPeople(page, pageSize);
    const dto = toPersonCollectionDto(result.items, page, pageSize, result.hasNextPage);
    res.status(200).json({ ...dto, ...paginationLinks(req, dto) });
});

router.get("/search", async (req, res) => {
    const name = req.query.name;
    if (typeof name !== "string" || !name.trim()) throw new BadRequest("name must be a non-empty string");
    const pagination = parsePagination(req.query);
    const rows = await personSearch(name, pagination);
    res.json(toPage(req, rows.map(toPersonReference), pagination));
});

router.get("/:nconst", async (req, res) => {
    const nconst = parseNconst(req.params.nconst);
    const person = await findPerson(nconst);
    if (!person) {
        throw new NotFound("Person not found");
    }
    res.status(200).json(toPersonDto(person));
});

router.get("/:nconst/co-players", async (req, res) => {
    const nconst = parseNconst(req.params.nconst);
    const { page, pageSize } = parsePagination(req.query);

    const person = await findPerson(nconst);
    if (!person) {
        throw new NotFound("Person not found");
    }

    const result = await findCoPlayers(nconst, page, pageSize);
    const dto = toCoPlayerCollectionDto(result.items, page, pageSize, result.hasNextPage);
    res.status(200).json({ ...dto, ...paginationLinks(req, dto) });
});

router.get("/:nconst/words", async (req, res) => {
    const nconst = parseNconst(req.params.nconst);
    const pagination = parsePagination(req.query, 10);
    const word = parseWordFilter(req.query.word);
    const person = await findPerson(nconst);
    if (!person) {
        throw new NotFound("Person not found");
    }

    const rows = await findPersonWords(nconst, word, pagination);
    const path = toPersonDto(person).wordsUri;
    res.json(toPage(req, rows.map(row => toWordReference(row, path)), pagination));
});

export default router;
