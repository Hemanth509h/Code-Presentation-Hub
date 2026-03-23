import app from "./app.js";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS custom_tests (
      id SERIAL PRIMARY KEY,
      custom_test_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'technical',
      description TEXT NOT NULL DEFAULT '',
      duration_minutes INTEGER NOT NULL DEFAULT 30,
      created_by TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS custom_test_questions (
      id SERIAL PRIMARY KEY,
      question_id TEXT NOT NULL UNIQUE,
      custom_test_id TEXT NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL DEFAULT 'multiple_choice',
      options TEXT[],
      correct_option INTEGER,
      points REAL NOT NULL DEFAULT 1,
      FOREIGN KEY (custom_test_id) REFERENCES custom_tests(custom_test_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS custom_test_assignments (
      id SERIAL PRIMARY KEY,
      custom_test_id TEXT NOT NULL,
      candidate_id TEXT NOT NULL,
      assigned_at TIMESTAMPTZ DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'pending',
      UNIQUE(custom_test_id, candidate_id),
      FOREIGN KEY (custom_test_id) REFERENCES custom_tests(custom_test_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS custom_test_submissions (
      id SERIAL PRIMARY KEY,
      custom_test_id TEXT NOT NULL,
      candidate_id TEXT NOT NULL,
      score REAL NOT NULL DEFAULT 0,
      max_score REAL NOT NULL DEFAULT 0,
      percentage REAL NOT NULL DEFAULT 0,
      passed BOOLEAN NOT NULL DEFAULT FALSE,
      completed_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(custom_test_id, candidate_id),
      FOREIGN KEY (custom_test_id) REFERENCES custom_tests(custom_test_id) ON DELETE CASCADE
    );
  `);
  console.log("DB migrations complete");
}

runMigrations()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
