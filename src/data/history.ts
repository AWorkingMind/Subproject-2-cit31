import { pool } from "../db.js";
import type { SearchHistoryRow } from "../types/SearchHistoryRow.js";
import type { RatingHistoryRow } from "../types/RatingHistoryRow.js";

export async function getSearchHistory(userId: number): Promise<SearchHistoryRow[]> {
    const result = await pool.query<SearchHistoryRow>(
        "SELECT * FROM get_search_history($1)",
        [userId]
    );

    return result.rows;
}

export async function getRatingHistory(userId: number): Promise<RatingHistoryRow[]> {
    const result = await pool.query<RatingHistoryRow>(
        "SELECT * FROM get_rating_history($1)",
        [userId]
    );

    return result.rows;
}