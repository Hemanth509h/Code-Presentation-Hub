import { existsSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import { ENV_DEFAULTS } from "@workspace/env";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const files = {
  "backend/.env": `SUPABASE_URL=${ENV_DEFAULTS.SUPABASE_URL}\nSUPABASE_SERVICE_ROLE_KEY=${ENV_DEFAULTS.SUPABASE_SERVICE_ROLE_KEY}\nSUPABASE_DB_URL=${ENV_DEFAULTS.SUPABASE_DB_URL}\n`,
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
