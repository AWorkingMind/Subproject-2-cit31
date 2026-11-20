import { queryPage } from "./pagination.js";
import { pool } from "../db.js";
import type { Pagination } from "../types/Pagination.js";
import type { SearchHistoryRow } from "../types/SearchHistoryRow.js";
import type { RatingHistoryRow } from "../types/RatingHistoryRow.js";

export function getSearchHistory(userId: number, pagination: Pagination) {
    return queryPage<SearchHistoryRow>(
        `SELECT * FROM get_search_history($1) ORDER BY searched_at DESC, search_id DESC`,
        [userId],
        pagination
    );
}

export function getRatingHistory(userId: number, pagination: Pagination) {
    return queryPage<RatingHistoryRow>(
        `SELECT * FROM get_rating_history($1) ORDER BY rated_at DESC, rating_id DESC`,
        [userId],
        pagination
    );
}

export async function findSearchHistoryEntry(userId: number, searchId: number) {
    const result = await pool.query<SearchHistoryRow>(
        "SELECT * FROM get_search_history($1) WHERE search_id = $2::bigint",
        [userId, searchId]
    );
    return result.rows[0];
}

export async function findRatingHistoryEntry(userId: number, ratingId: number) {
    const result = await pool.query<RatingHistoryRow>(
        "SELECT * FROM get_rating_history($1) WHERE rating_id = $2::bigint",
        [userId, ratingId]
    );
    return result.rows[0];
}
