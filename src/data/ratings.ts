import { DatabaseError } from "pg";
import { pool } from "../db.js";
import { Conflict, NotFound } from "../middleware/errorHandler.js";

export async function rateTitle(userId: number, tconst: string, score: number): Promise<void> {
    try {
        await pool.query("SELECT public.rate($1, $2, $3)", [userId, tconst, score]);
    } catch (error) {
        if (error instanceof DatabaseError) {
            if (error.code === "23503" && error.constraint === "fk_rating_history_user") {
                throw new NotFound("User not found");
            }
            if (error.code === "23503" && error.constraint === "fk_rating_history_title") {
                throw new NotFound("Title not found");
            }
            if (error.code === "23505" && error.constraint === "uq_rating_history_user_title") {
                throw new Conflict("Rating was changed concurrently; retry the request");
            }
        }
        throw error;
    }
}
