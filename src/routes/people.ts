import { Router } from "express";
import { findCoPlayers, findPeople, findPerson } from "../data/people.js";
import { NotFound } from "../middleware/errorHandler.js";
import { parseCoPlayerPagination, parseNconst, parsePeoplePagination } from "../validation.js";
import { toCoPlayerCollectionDto, toPersonCollectionDto, toPersonDto } from "./dto.js";

const router = Router();

router.get("/", async (req, res) => {
    const { page, pageSize } = parsePeoplePagination(req.query);
    const result = await findPeople(page);
    const dto = toPersonCollectionDto(result.items, page, pageSize, result.hasNextPage);
    res.status(200).json(dto);
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

export default router;
