import { supabase } from "../lib/supabase.js";

export async function requireAuth(req, res, next) {
  const token = req.cookies?.sb_access_token;
  if (!token) {
    return res.status(401).json({ error: "unauthorized", message: "Not authenticated" });
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "unauthorized", message: "Invalid session" });
  }
  req.user = {
    id: data.user.id,
    email: data.user.email,
    role: data.user.user_metadata?.role || "candidate",
  };
  next();
}
