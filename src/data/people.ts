import { pool } from "../db.js";
import { MAX_DATABASE_LIMIT, queryPage } from "./pagination.js";
import type { Pagination } from "../types/Pagination.js";
import type { PersonRow } from "../types/PersonRow.js";
import type { PersonSearchRow } from "../types/PersonSearchRow.js";
import type { CoPlayerRow } from "../types/CoPlayerRow.js";
import type { RelatedWordRow } from "../types/RelatedWordRow.js";

export async function findPersonWords(nconst: string, word: string | null, pagination: Pagination) {
    const result = await queryPage<RelatedWordRow>(
        `SELECT word, frequency FROM public.person_words($1, $2)
         WHERE ($3::text IS NULL OR word = $3) ORDER BY frequency DESC, word`,
        [nconst, MAX_DATABASE_LIMIT, word],
        pagination
    );
    return { ...result, items: result.items.map(({ word, frequency }) => ({ word, frequency: Number(frequency) })) };
}

export function findCoPlayers(nconst: string, pagination: Pagination) {
    return queryPage<CoPlayerRow>(
        `SELECT * FROM public.co_players($1) ORDER BY frequency DESC, "primaryName", nconst`,
        [nconst],
        pagination
    );
}

export function findPeople(pagination: Pagination) {
    return queryPage<PersonRow>("SELECT * FROM public.person ORDER BY nconst", [], pagination);
}

export async function findPerson(nconst: string): Promise<PersonRow | undefined> {
    const result = await pool.query<PersonRow>(
        "SELECT * FROM public.person WHERE nconst = $1",
        [nconst]
    );

    return result.rows[0];
}


export function personSearch(searchString: string, pagination: Pagination) {
    return queryPage<PersonSearchRow>(
        `SELECT * FROM public.person_search($1) ORDER BY "primaryName", nconst`,
        [searchString],
        pagination
    );
}
