import type { Request } from "express";
import type { PaginatedDto } from "../types/PaginatedDto.js";
import type { Pagination } from "../types/Pagination.js";

export function toPage<T>(req: Request, rows: T[], { page, pageSize }: Pagination) {
    const dto = {
        items: rows.slice(0, pageSize),
        page,
        pageSize,
        hasNextPage: rows.length > pageSize,
    };
    return { ...dto, ...paginationLinks(req, dto) };
}

export function paginationLinks(req: Request, { page, pageSize, hasNextPage }: PaginatedDto<unknown>) {
    const url = new URL(`${req.protocol}://${req.get("host")}${req.originalUrl}`);
    url.searchParams.set("pageSize", String(pageSize));

    function pageUri(target: number): string {
        url.searchParams.set("page", String(target));
        return url.href;
    }

    return {
        prevPageUri: page > 1 ? pageUri(page - 1) : null,
        nextPageUri: hasNextPage ? pageUri(page + 1) : null,
    };
}
