import { pool } from "../db.js";
import type { SearchResultRow } from "../types/SearchResultRow.js";
import type { WeightedSearchRow } from "../types/WeightedSearchRow.js";
import type { SimilarMovieRow } from "../types/SimilarMovieRow.js";
import type { BestMatchSearchRow } from "../types/BestMatchSearchRow.js";
import type { RelatedWordRow } from "../types/RelatedWordRow.js";

export async function structuredSearch(
    userId: number,
    filters: { title: string | null; plot: string | null; character: string | null; person: string | null }
): Promise<SearchResultRow[]> {
    const { title, plot, character, person } = filters;
    const result = await pool.query<SearchResultRow>(
        "SELECT * FROM public.structured_string_search($1, $2, $3, $4, $5)",
        [userId, title, plot, character, person]
    );
    return result.rows;
}

export async function exactMatchSearch(words: string[]): Promise<SearchResultRow[]> {
    const result = await pool.query<SearchResultRow>(
        "SELECT * FROM public.exact_match_search($1)",
        [words]
    );
    return result.rows;
}

export async function bestMatchSearch(words: string[]): Promise<BestMatchSearchRow[]> {
    const result = await pool.query<BestMatchSearchRow>(
        "SELECT * FROM public.best_match_search($1)",
        [words]
    );
    return result.rows;
}

export async function relatedWords(words: string[], limit: number): Promise<RelatedWordRow[]> {
    const result = await pool.query<RelatedWordRow>(
        "SELECT * FROM public.related_words($1, $2)",
        [words, limit]
    );
    return result.rows;
}

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
