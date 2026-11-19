import { Router } from "express";
import { findCoPlayers, findPeople, findPerson, findPersonWords, personSearch } from "../data/people.js";
import { BadRequest, NotFound } from "../middleware/errorHandler.js";
import { parseCoPlayerPagination, parseNconst, parsePeoplePagination } from "../validation.js";
import { toCoPlayerCollectionDto, toPersonCollectionDto, toPersonDto } from "./dto.js";

const router = Router();

router.get("/", async (req, res) => {
    const { page, pageSize } = parsePeoplePagination(req.query);
    const result = await findPeople(page);
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
    const { page, pageSize } = parseCoPlayerPagination(req.query);

    const person = await findPerson(nconst);
    if (!person) {
        throw new NotFound("Person not found");
    }

    const result = await findCoPlayers(nconst, page);
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
