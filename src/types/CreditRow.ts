export interface CreditRow {
    id: number;
    tconst: string;
    nconst: string;
    ordering: number | null;
    category: string | null;
    job: string | null;
    character: string | null;
    knownFor: boolean;
}
