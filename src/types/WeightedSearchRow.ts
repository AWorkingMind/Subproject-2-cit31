// PostgreSQL returnerer denne numeriske v?rdi som en streng via pg.
export type WeightedSearchRow = {
    tconst: string;
    primaryTitle: string;
    score: string;
};
