// lib/db.ts
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool =
  global.pgPool ??
  new Pool({
    connectionString,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  global.pgPool = pool;
}

export async function query<T = any>(text: string, params?: any[]) {
  const res = await pool.query(text, params);
  return res;
}
