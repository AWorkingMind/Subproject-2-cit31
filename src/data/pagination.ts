import type { QueryResultRow } from "pg";
import { pool } from "../db.js";
import type { Pagination } from "../types/Pagination.js";

export const MAX_DATABASE_LIMIT = 2147483647;

export async function queryPage<Row extends QueryResultRow>(
    sql: string,
    params: readonly (number | string | string[] | null)[],
    { page, pageSize }: Pagination
) {
    // Include the previous page to detect it even when it is only partly filled.
    const previousPageSize = page > 1 ? pageSize : 0;
    const offset = (page - 1) * pageSize - previousPageSize;
    const result = await pool.query<Row>(
        `${sql} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, previousPageSize + pageSize + 1, offset]
    );
    return {
        items: result.rows.slice(previousPageSize, previousPageSize + pageSize),
        hasPreviousPage: previousPageSize > 0 && result.rows.length > 0,
        hasNextPage: result.rows.length > previousPageSize + pageSize,
    };
}
