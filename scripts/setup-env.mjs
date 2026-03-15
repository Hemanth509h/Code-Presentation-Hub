import { existsSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const files = {
  "backend/.env": `SUPABASE_URL=https://tyqhiomtpdsxlxtloscz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cWhpb210cGRzeGx4dGxvc2N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ5MTk5NiwiZXhwIjoyMDg5MDY3OTk2fQ.dHb1XVY9GilT__upowrztJeeJfug3W4g59soc6XoNUU
SUPABASE_DB_URL=postgresql://postgres:Htnameh509%40h@db.tyqhiomtpdsxlxtloscz.supabase.co:5432/postgres?sslmode=require
`,
  "frontend/.env": `VITE_SUPABASE_URL=https://tyqhiomtpdsxlxtloscz.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_mlEXqgdUhG9aI0mUTMHm0w_65vt8e-r
`,
};

let created = 0;
let skipped = 0;

for (const [rel, content] of Object.entries(files)) {
  const dest = resolve(root, rel);
  if (existsSync(dest)) {
    console.log(`  skipped  ${rel} (already exists)`);
    skipped++;
  } else {
    writeFileSync(dest, content, "utf8");
    console.log(`  created  ${rel}`);
    created++;
  }
}

console.log(`\nDone. ${created} created, ${skipped} skipped.`);
