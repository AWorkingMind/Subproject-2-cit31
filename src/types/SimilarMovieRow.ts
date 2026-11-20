// PostgreSQL returnerer denne numeriske v?rdi som en streng via pg.
export type SimilarMovieRow = {
    tconst: string;
    primaryTitle: string;
    shared_genres: string;
};
