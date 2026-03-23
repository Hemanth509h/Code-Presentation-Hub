import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl) throw new Error("REACT_APP_SUPABASE_URL env var is required");
if (!supabaseAnonKey) throw new Error("REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY env var is required");

export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
