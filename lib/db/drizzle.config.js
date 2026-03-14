import { defineConfig } from "drizzle-kit";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("SUPABASE_DB_URL must be set. Please configure your Supabase database connection.");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.js"),
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
