import type { TitleRow } from "./TitleRow.js";

export type TitleDetailsRow = TitleRow & {
    titleTypeName: string;
    genres: string[];
    averageRating: number | null;
    numVotes: number;
};
