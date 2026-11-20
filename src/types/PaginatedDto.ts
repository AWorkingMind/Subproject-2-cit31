export interface PaginatedDto<T> {
    items: T[];
    page: number;
    pageSize: number;
    hasNextPage: boolean;
    prevPageUri: string | null;
    nextPageUri: string | null;
}
