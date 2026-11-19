import { pool } from "../db.js";
import type { PersonRow } from "../types/PersonRow.js";
import type { CoPlayerRow } from "../types/CoPlayerRow.js";

export const DEFAULT_PEOPLE_PAGE_SIZE = 10;
export const MAX_PEOPLE_PAGE_SIZE = 50;

export const DEFAULT_CO_PLAYERS_PAGE_SIZE = 50;
export const MAX_CO_PLAYERS_PAGE_SIZE = 50;

export async function findPersonWords(nconst: string): Promise<{ word: string; frequency: number }[]> {
    const result = await pool.query<{ word: string; frequency: string }>(
        `SELECT word, frequency FROM public.person_words($1)
         ORDER BY frequency DESC, word`,
        [nconst]
    );

    return result.rows.map(({ word, frequency }) => ({ word, frequency: Number(frequency) }));
}

export async function findCoPlayers(nconst: string, page: number, pageSize: number): Promise<{ items: CoPlayerRow[]; hasNextPage: boolean; }> {
    const offset = (page - 1) * pageSize;
    const result = await pool.query<CoPlayerRow>(
        `SELECT * FROM public.co_players($1)
         ORDER BY frequency DESC, "primaryName", nconst
         LIMIT $2 OFFSET $3`,
        [nconst, pageSize + 1, offset]
    );

    return {
        items: result.rows.slice(0, pageSize),
        hasNextPage: result.rows.length > pageSize,
    };
}

export async function findPeople(page: number, pageSize: number): Promise<{ items: PersonRow[]; hasNextPage: boolean; }> {
    const offset = (page - 1) * pageSize;
    const result = await pool.query<PersonRow>(
        `SELECT * FROM public.person
         ORDER BY nconst
         LIMIT $1 OFFSET $2`,
        [pageSize + 1, offset]
    );

    return {
        items: result.rows.slice(0, pageSize),
        hasNextPage: result.rows.length > pageSize,
    };
}

export async function findPerson(nconst: string): Promise<PersonRow | undefined> {
    const result = await pool.query<PersonRow>(
        "SELECT * FROM public.person WHERE nconst = $1",
        [nconst]
    );

    return result.rows[0];
}


export type PersonSearchRow = {
    nconst: string;
    primaryName: string;
    birthyear: string | null;
    deathyear: string | null;
}

export async function personSearch (searchString: string): Promise<PersonSearchRow[]> {
    const result = await pool.query<PersonSearchRow>(
        'SELECT * FROM person_search($1)',
        [searchString]
    );

    return result.rows;
}
