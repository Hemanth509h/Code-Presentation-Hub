import { supabase } from './lib/supabase.js';
async function test() {
  const { data, error } = await supabase.from('candidates').select('*').limit(1);
  console.log("Columns:", Object.keys(data[0] || {}));
  process.exit(0);
}
test();
