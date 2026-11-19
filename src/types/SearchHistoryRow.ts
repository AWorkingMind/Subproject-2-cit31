export type SearchHistoryRow = {
    search_id: number;
    search_parameters: Record<string, unknown>;
    searched_at: Date;
};
