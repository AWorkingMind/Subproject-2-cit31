import type { SearchResultRow } from "./SearchResultRow.js";

export type BestMatchSearchRow = SearchResultRow & {
    matched_words: string;
};
