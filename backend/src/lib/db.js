import pg from "pg";
import { getEnv } from "@workspace/env";

const { Pool } = pg;

const connectionString = getEnv("SUPABASE_DB_URL") || getEnv("DATABASE_URL");

if (!connectionString) {
  throw new Error("SUPABASE_DB_URL or DATABASE_URL must be set");
}

const cleanUrl = connectionString.replace("?sslmode=require", "");

export const pool = new Pool({
  connectionString: cleanUrl,
  ssl: { rejectUnauthorized: false },
});
