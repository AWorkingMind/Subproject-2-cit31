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
import { toCoPlayerDto, toPersonDto, toPersonReference, toWordReference } from "./dto.js";
import { toPage } from "./pagination.js";

const router = Router();

router.get("/", async (req, res) => {
    const pagination = parsePagination(req.query);
    const result = await findPeople(pagination);
    res.json(toPage(req, result, pagination, toPersonDto));
});

router.get("/search", async (req, res) => {
    const name = req.query.name;
    if (typeof name !== "string" || !name.trim()) throw new BadRequest("name must be a non-empty string");
    const pagination = parsePagination(req.query);
    const rows = await personSearch(name, pagination);
    res.json(toPage(req, rows, pagination, toPersonReference));
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
    const pagination = parsePagination(req.query);

    const person = await findPerson(nconst);
    if (!person) {
        throw new NotFound("Person not found");
    }

    const result = await findCoPlayers(nconst, pagination);
    res.json(toPage(req, result, pagination, toCoPlayerDto));
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
    res.json(toPage(req, rows, pagination, row => toWordReference(row, path)));
});

export default router;
