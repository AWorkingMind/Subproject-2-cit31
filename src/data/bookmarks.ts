import { pool } from "../db.js";
import { queryPage } from "./pagination.js";
import type { Pagination } from "../types/Pagination.js";
import type { BookmarkTitleRow } from "../types/BookmarkTitleRow.js";
import type { BookmarkPersonRow } from "../types/BookmarkPersonRow.js";
import type { BookmarkRow } from "../types/BookmarkRow.js";

export async function bookmarkTitle(userId: number, tconst: string): Promise<number> {
    const result = await pool.query<BookmarkTitleRow>(
        "SELECT bookmark_title($1, $2)",
        [userId, tconst]
    );

    const row = result.rows[0];
    if (!row) throw new Error("bookmark_title returned no result");
    return row.bookmark_title;
}
export async function bookmarkPerson(userId: number, nconst: string): Promise<number> {
    const result = await pool.query<BookmarkPersonRow>(
        "SELECT bookmark_person($1, $2)",
        [userId, nconst]
    );

    const row = result.rows[0];
    if (!row) throw new Error("bookmark_person returned no result");
    return row.bookmark_person;
}
export function getBookmarks(userId: number, pagination: Pagination) {
    return queryPage<BookmarkRow>(
        `SELECT * FROM get_bookmarks($1) ORDER BY created_at DESC, bookmark_id DESC`,
        [userId],
        pagination
    );
}
export async function findBookmark(userId: number, bookmarkId: number) {
    const result = await pool.query<BookmarkRow>(
        "SELECT * FROM get_bookmarks($1) WHERE bookmark_id = $2::bigint",
        [userId, bookmarkId]
    );
    return result.rows[0];
}

export async function deleteBookmark(userId: number, bookmarkId: number): Promise<boolean> {
    const result = await pool.query(
        `DELETE FROM bookmarks
        WHERE bookmark_id = $1
          AND user_id = $2
        `,
        [bookmarkId, userId]
    );

    return result.rowCount === 1;
}
