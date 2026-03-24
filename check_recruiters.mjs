import { supabase } from "./backend/src/lib/supabase.js";

async function main() {
  const { data, error } = await supabase.from('recruiters').select('*').limit(1);
  console.log("Data:", data);
  console.log("Error:", error);
}

main();
