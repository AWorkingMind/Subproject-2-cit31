import { queryPage } from "./pagination.js";
import type { Pagination } from "../types/Pagination.js";
import type { SearchResultRow } from "../types/SearchResultRow.js";
import type { WeightedSearchRow } from "../types/WeightedSearchRow.js";
import type { SimilarMovieRow } from "../types/SimilarMovieRow.js";
import type { BestMatchSearchRow } from "../types/BestMatchSearchRow.js";
import type { RelatedWordRow } from "../types/RelatedWordRow.js";

export function structuredSearch(
    userId: number,
    filters: { title: string | null; plot: string | null; character: string | null; person: string | null },
    pagination: Pagination
) {
    return queryPage<SearchResultRow>(
        `SELECT * FROM public.structured_string_search($1, $2, $3, $4, $5) ORDER BY "primaryTitle", tconst`,
        [userId, filters.title, filters.plot, filters.character, filters.person],
        pagination
    );
}

export function exactMatchSearch(words: string[], pagination: Pagination) {
    return queryPage<SearchResultRow>(
        `SELECT * FROM public.exact_match_search($1) ORDER BY "primaryTitle", tconst`,
        [words],
        pagination
    );
}

export function bestMatchSearch(words: string[], pagination: Pagination) {
    return queryPage<BestMatchSearchRow>(
        `SELECT * FROM public.best_match_search($1) ORDER BY matched_words DESC, "primaryTitle", tconst`,
        [words],
        pagination
    );
}

export function relatedWords(words: string[], limit: number, word: string | null, pagination: Pagination) {
    return queryPage<RelatedWordRow>(
        `SELECT * FROM public.related_words($1, $2) WHERE ($3::text IS NULL OR word = $3) ORDER BY frequency DESC, word`,
        [words, limit, word],
        pagination
    );
}

//her laver jeg en function ved navn "stringSearch" og anvender de korrekte værdier som parameter defineret i vores SQL funktioner
//Denne fremgang gentager sig meget.
export function stringSearch(userId: number | null, searchString: string, pagination: Pagination) {
    if (userId === null) {
        return queryPage<SearchResultRow>(
            `SELECT tconst, "primaryTitle"
             FROM public.title
             WHERE "primaryTitle" ILIKE '%' || $1 || '%'
                OR COALESCE(plot, '') ILIKE '%' || $1 || '%'
             ORDER BY "primaryTitle", tconst`,
            [searchString],
            pagination
        );
    }
    return queryPage<SearchResultRow>(
        `SELECT * FROM public.string_search($1, $2) ORDER BY "primaryTitle", tconst`,
        [userId, searchString],
        pagination
    );
}

export function weightedSearch(words: string[], pagination: Pagination) {
    return queryPage<WeightedSearchRow>(
        `SELECT * FROM weighted_search($1) ORDER BY score DESC, "primaryTitle", tconst`,
        [words],
        pagination
    );
}

export function similarMovies(tconst: string, limit: number, pagination: Pagination) {
    return queryPage<SimilarMovieRow>(
        `SELECT * FROM similar_movies($1, $2) ORDER BY shared_genres DESC, "primaryTitle", tconst`,
        [tconst, limit],
        pagination
    );
}
