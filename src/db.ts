import "dotenv/config";
import { Pool } from "pg";


export const pool = new Pool({
    host: (process.env.PGHOST ?? process.env.DB_HOST),
    port: Number((process.env.PGPORT ?? process.env.DB_PORT)),
    database: (process.env.PGDATABASE ?? process.env.DB_NAME),
    user: (process.env.PGUSER ?? process.env.DB_USER),
    password: (process.env.PGPASSWORD ?? process.env.DB_PASSWORD),
});