import {Router} from "express";
import {personSearch} from "../data/people.js";

export const peopleRouter = Router();

peopleRouter.get("/search", async (req, res, next) => {
    try {
        const searchString = req.query.name;

        if (typeof searchString !== "string" || searchString.trim() === "") {
            res.status(400).json({
                error: "name must be a non-empty string"
            });
            return;
        }

        const results = await personSearch(searchString);

        res.json(results);
    } catch (err) {
        next (err);
    }
    });