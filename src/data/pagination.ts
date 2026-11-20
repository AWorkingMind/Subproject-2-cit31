import type { QueryResultRow } from "pg";
import { pool } from "../db.js";
import type { Pagination } from "../types/Pagination.js";

export const MAX_DATABASE_LIMIT = 2147483647;

export async function queryPage<Row extends QueryResultRow>(
    sql: string,
    params: readonly (number | string | string[] | null)[],
    { page, pageSize }: Pagination
): Promise<Row[]> {
    const result = await pool.query<Row>(
        `${sql} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, pageSize + 1, (page - 1) * pageSize]
    );
    return result.rows;
}
