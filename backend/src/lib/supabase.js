import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://tyqhiomtpdsxlxtloscz.supabase.co';
const supabaseServiceKey = 'sb_publishable_mlEXqgdUhG9aI0mUTMHm0w_65vt8e-r';

if (!supabaseUrl) throw new Error("SUPABASE_URL env var is required");
if (!supabaseServiceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY env var is required");

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});
