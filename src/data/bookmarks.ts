import { pool } from "../db.js";
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
export async function getBookmarks(userId: number): Promise<BookmarkRow[]> {
    const result = await pool.query<BookmarkRow>(
        "SELECT * FROM get_bookmarks($1)",
        [userId]
    );

    return result.rows;
}