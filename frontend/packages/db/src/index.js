import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";
import { getEnv } from "@workspace/env";

const { Pool } = pg;

const connectionString = getEnv("SUPABASE_DB_URL") || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "SUPABASE_DB_URL must be set. Please configure your Supabase database connection.",
  );
}

const parsedUrl = connectionString.replace('?sslmode=require', '');
export const pool = new Pool({ 
  connectionString: parsedUrl,
  ssl: { rejectUnauthorized: false }
});
export const db = drizzle(pool, { schema });

export * from "./schema/index.js";
