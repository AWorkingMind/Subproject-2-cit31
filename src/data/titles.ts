import { pool } from "../db.js";
import { queryPage } from "./pagination.js";
import type { Pagination } from "../types/Pagination.js";
import type { CreditDetailsRow } from "../types/CreditDetailsRow.js";
import type { PopularActorRow } from "../types/PopularActorRow.js";
import type { TitleDetailsRow } from "../types/TitleDetailsRow.js";

export function findPopularActors(tconst: string, pagination: Pagination) {
    return queryPage<PopularActorRow>(
        `SELECT nconst, "primaryName", name_rating FROM public.popular_actors($1) ORDER BY name_rating DESC NULLS LAST, "primaryName", nconst`,
        [tconst],
        pagination
    );
}

export function findTitleCredits(tconst: string, pagination: Pagination) {
    return queryPage<CreditDetailsRow>(
        `SELECT c.*, p."primaryName"
         FROM public.credit AS c
         LEFT JOIN public.person AS p ON p.nconst = c.nconst
         WHERE c.tconst = $1
         ORDER BY c.ordering, c.id`,
        [tconst],
        pagination
    );
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

export function findTitles(pagination: Pagination) {
    return queryPage<TitleDetailsRow>(`${titleDetailsQuery} ORDER BY t.tconst`, [], pagination);
}
