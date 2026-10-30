import pg from 'pg';
import dotenv from 'dotenv';

// Loads values from the .env file.
// This allows us to keep database passwords and connection details
// outside of the source code.
dotenv.config();

const { Pool } = pg;

// Creates a PostgreSQL connection pool.
//
// The pool manages connections between our TypeScript backend
// and the PostgreSQL database.
//
// Files inside the data layer can import this pool
// when they need to run SQL or call PostgreSQL functions.
export const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});