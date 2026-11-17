import { pool } from "../db.js";

//Dette er selve strukturen for hvordan det tilbagevendt row skal se ud. Vi fortæller at det her er sådan
//vores resultat ska se ud
export type SearchResultRow = {
    tconst: string;
    primaryTitle: string;
};
export type WeightedSearchRow = {
    tconst: string;
    primaryTitle: string;
    score: string;
};
//PostgresSQL numerisk værdi kommer typisk tilbage igennem pg biblioteket som strings, hvilke er derfor score har string
export type SimilarMovieRow = {
    tconst: string;
    primaryTitle: string;
    shared_genres: string;
};
//Igen bliver bigint værdier returnere som string hvilke forklare shared_generes

//her laver jeg en function ved navn "stringSearch" og anvender de korrekte værdier som parameter defineret i vores SQL funktioner
//Denne fremgang gentager sig meget.
export async function stringSearch(userId: number | null, searchString: string): Promise<SearchResultRow[]> {
const result = await pool.query<SearchResultRow>(
    'SELECT * FROM string_search($1,$2)',
    [userId, searchString]
)

    return result.rows;
}

export async function weightedSearch(words: string[]): Promise<WeightedSearchRow[]> {
    const result = await pool.query<WeightedSearchRow>(
        "SELECT * FROM weighted_search($1)",
        [words]
    );

    return result.rows;
}

export async function similarMovies(tconst: string, limit: number): Promise<SimilarMovieRow[]> {
    const result = await pool.query<SimilarMovieRow>(
        "SELECT * FROM similar_movies($1, $2)",
        [tconst, limit]
    );

    return result.rows;
}