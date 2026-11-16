import { pool } from "../db.js";

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