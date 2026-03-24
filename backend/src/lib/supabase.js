import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@workspace/env";

const supabaseUrl = getEnv("SUPABASE_URL");
const supabaseServiceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl) throw new Error("SUPABASE_URL is required");
if (!supabaseServiceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});
