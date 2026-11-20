import type { CreditRow } from "./CreditRow.js";

export type CreditDetailsRow = CreditRow & {
    primaryName: string | null;
};
