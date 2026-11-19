import { Router } from "express";
import { pool } from "../db.js";
import { ServiceUnavailable } from "../middleware/errorHandler.js";

const router = Router();

router.get("/db", async (_req, res) => {
    try {
        const result = await pool.query("SELECT 1 AS connected");

        res.status(200).json(result.rows[0]);
    } catch (error) {
        throw new ServiceUnavailable("Database unavailable", {cause: error});
    }
});

export default router;
