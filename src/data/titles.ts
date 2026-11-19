import { pool } from "../db.js";
import type { TitleRow } from "../types/TitleRow.js";
import type { CreditDetailsRow } from "../types/CreditRow.js";

export const DEFAULT_TITLE_PAGE_SIZE = 10;
export const MAX_TITLE_PAGE_SIZE = 50;

export type TitleDetailsRow = TitleRow & {
    titleTypeName: string;
    genres: string[];
    averageRating: number | null;
    numVotes: number;
};

export async function findTitleCredits(
    tconst: string
): Promise<CreditDetailsRow[]> {
    const result = await pool.query<CreditDetailsRow>(
        `SELECT c.*, p."primaryName"
         FROM public.credit AS c
         LEFT JOIN public.person AS p ON p.nconst = c.nconst
         WHERE c.tconst = $1
         ORDER BY c.ordering, c.id`,
        [tconst]
    );

    return result.rows;
}

const titleDetailsQuery = `SELECT t.*, tt.type AS "titleTypeName",
                COALESCE(tg.genres, ARRAY[]::text[]) AS genres,
                tr."averageRating"::double precision AS "averageRating",
                COALESCE(tr."numVotes", 0) AS "numVotes"
         FROM public.title AS t
         JOIN public.title_type AS tt ON t."titleType" = tt.id
         LEFT JOIN public.title_rating AS tr ON tr.tconst = t.tconst
         LEFT JOIN LATERAL (
             SELECT
                    array_agg(DISTINCT g.name::text ORDER BY g.name::text) AS genres
             FROM public.title_genre
             JOIN public.genre AS g ON title_genre.genre_id = g.id
             WHERE title_genre.tconst = t.tconst
         ) AS tg ON true`;

export async function findTitle(tconst: string): Promise<TitleDetailsRow | undefined> {
    const result = await pool.query<TitleDetailsRow>(
        `${titleDetailsQuery} WHERE t.tconst = $1`,
        [tconst]
    );
    return result.rows[0];
}

export async function findTitles(page: number, pageSize: number): Promise<{ items: TitleDetailsRow[]; hasNextPage: boolean; }> {
    const offset = (page - 1) * pageSize;
    const result = await pool.query<TitleDetailsRow>(
        `${titleDetailsQuery}
         ORDER BY t.tconst
         LIMIT $1 OFFSET $2`,
        [pageSize + 1, offset]
    );

    return {
        items: result.rows.slice(0, pageSize),
        hasNextPage: result.rows.length > pageSize,
    };
}
