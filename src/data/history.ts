import { pool } from "../db.js";

export type SearchHistoryRow = {
    search_id: number;
    search_parameters: Record<string, unknown>;
    searched_at: Date;
};

export type RatingHistoryRow = {
    rating_id: number;
    tconst: string;
    score: number;
    rated_at: Date;
};

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