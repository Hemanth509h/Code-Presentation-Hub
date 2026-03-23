import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error("SUPABASE_URL env var is required");
if (!supabaseAnonKey) throw new Error("VITE_SUPABASE_ANON_KEY env var is required");

export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
