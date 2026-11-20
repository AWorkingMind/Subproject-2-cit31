import type { Request } from "express";
import type { PaginatedDto } from "../types/PaginatedDto.js";
import type { Pagination } from "../types/Pagination.js";

export function toPage<Row, Item>(
    req: Request,
    result: { items: Row[]; hasPreviousPage: boolean; hasNextPage: boolean },
    { page, pageSize }: Pagination,
    mapItem: (row: Row) => Item
): PaginatedDto<Item> {
    const { hasPreviousPage, hasNextPage } = result;
    const url = new URL(`${req.protocol}://${req.get("host")}${req.originalUrl}`);
    url.searchParams.set("pageSize", String(pageSize));

    function pageUri(target: number): string {
        url.searchParams.set("page", String(target));
        return url.href;
    }

    return {
        items: result.items.map(mapItem),
        page,
        pageSize,
        hasNextPage,
        prevPageUri: hasPreviousPage ? pageUri(page - 1) : null,
        nextPageUri: hasNextPage ? pageUri(page + 1) : null,
    };
}
