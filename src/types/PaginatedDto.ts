export interface PaginatedDto<T> {
    items: T[];
    page: number;
    pageSize: number;
    hasNextPage: boolean;
}
