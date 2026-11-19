import { Router } from "express";
import {
    findCoPlayers,
    findPeople,
    findPerson,
    findPersonWords,
    personSearch,
    DEFAULT_PEOPLE_PAGE_SIZE,
    MAX_PEOPLE_PAGE_SIZE,
    DEFAULT_CO_PLAYERS_PAGE_SIZE,
    MAX_CO_PLAYERS_PAGE_SIZE
} from "../data/people.js";
import { BadRequest, NotFound } from "../middleware/errorHandler.js";
import { parsePagination, parseNconst } from "../validation.js";
import { toCoPlayerCollectionDto, toPersonCollectionDto, toPersonDto } from "./dto.js";

const router = Router();

router.get("/", async (req, res) => {
    const { page, pageSize } = parsePagination(req.query, DEFAULT_PEOPLE_PAGE_SIZE, MAX_PEOPLE_PAGE_SIZE);
    const result = await findPeople(page, pageSize);
    const dto = toPersonCollectionDto(result.items, page, pageSize, result.hasNextPage);
    res.status(200).json(dto);
});

router.get("/search", async (req, res) => {
    const name = req.query.name;
    if (typeof name !== "string" || !name.trim()) throw new BadRequest("name must be a non-empty string");
    res.json(await personSearch(name));
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
    const { page, pageSize } = parsePagination(req.query, DEFAULT_CO_PLAYERS_PAGE_SIZE, MAX_CO_PLAYERS_PAGE_SIZE);

    const person = await findPerson(nconst);
    if (!person) {
        throw new NotFound("Person not found");
    }

    const result = await findCoPlayers(nconst, page, pageSize);
    const dto = toCoPlayerCollectionDto(result.items, page, pageSize, result.hasNextPage);
    res.status(200).json(dto);
});

router.get("/:nconst/words", async (req, res) => {
    const nconst = parseNconst(req.params.nconst);
    const person = await findPerson(nconst);
    if (!person) {
        throw new NotFound("Person not found");
    }

    res.json(await findPersonWords(nconst));
});

export default router;
