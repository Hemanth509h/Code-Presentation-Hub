import { supabase } from "../lib/supabase.js";

export async function requireAuth(req, res, next) {
  const token = req.cookies?.sb_access_token;
  if (!token) {
    console.warn(`[Auth] No token found in cookies for ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ error: "unauthorized", message: "Not authenticated" });
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    console.warn(`[Auth] Invalid token for ${req.method} ${req.originalUrl}:`, error?.message || "No user data");
    return res.status(401).json({ error: "unauthorized", message: "Invalid session" });
  }
  req.user = {
    id: data.user.id,
    email: data.user.email,
    role: data.user.user_metadata?.role || "candidate",
  };
  next();
}
