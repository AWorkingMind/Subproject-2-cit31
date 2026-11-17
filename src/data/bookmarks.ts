import { pool } from "../db.js";

export type BookmarkTitleRow = {
    bookmark_title: number;
};
//Denne type oven over er ikke nødvendig i det typen er direkte skrevet ind i bookmarkTitle, men er her for formalitet.
export type BookmarkPersonRow = {
    bookmark_person: number;
};

export type BookmarkRow = {
    bookmark_id: number;
    tconst: string | null;
    primary_title: string | null;
    nconst: string | null;
    primary_name: string | null;
    created_at: Date;
};

export async function bookmarkTitle(userId: number, tconst: string): Promise<number> {
    const result = await pool.query<{ bookmark_title: number }>(
        "SELECT bookmark_title($1, $2)",
        [userId, tconst]
    );

    return result.rows[0].bookmark_title;
}
export async function bookmarkPerson(userId: number, nconst: string): Promise<number> {
    const result = await pool.query<BookmarkPersonRow>(
        "SELECT bookmark_person($1, $2)",
        [userId, nconst]
    );

    return result.rows[0].bookmark_person;
}
export async function getBookmarks(userId: number): Promise<BookmarkRow[]> {
    const result = await pool.query<BookmarkRow>(
        "SELECT * FROM get_bookmarks($1)",
        [userId]
    );

    return result.rows;
}