import { Router } from "express";
import { supabaseAnon } from "../lib/supabase-anon.js";
import { supabase } from "../lib/supabase.js";

const router = Router();

const COOKIE_NAME = "sb_access_token";
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7 * 1000,
};

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "missing_fields", message: "Email and password are required" });
  }

  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (error) {
    return res.status(401).json({ error: "auth_error", message: error.message });
  }

  res.cookie(COOKIE_NAME, data.session.access_token, COOKIE_OPTS);

  const user = data.user;
  res.json({
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role || "candidate",
    name: user.user_metadata?.name || "",
  });
});

router.post("/register", async (req, res) => {
  const { email, password, role = "candidate" } = req.body;
  if (!["candidate", "recruiter"].includes(role)) {
    return res.status(400).json({ error: "invalid_role", message: "Role must be candidate or recruiter" });
  }
  if (!email || !password) {
    return res.status(400).json({ error: "missing_fields", message: "Email and password are required" });
  }

  const { data, error } = await supabaseAnon.auth.signUp({
    email,
    password,
    options: { data: { role } },
  });

  if (error) {
    return res.status(400).json({ error: "auth_error", message: error.message });
  }

  res.status(201).json({ success: true, email: data.user?.email });
});

router.post("/logout", async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    await supabaseAnon.auth.signOut();
  }
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: "lax" });
  res.json({ success: true });
});

router.get("/me", async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "unauthorized", message: "Not authenticated" });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: "lax" });
    return res.status(401).json({ error: "unauthorized", message: "Invalid or expired session" });
  }

  const user = data.user;
  res.json({
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role || "candidate",
    name: user.user_metadata?.name || "",
  });
});

router.put("/profile", requireAuth, async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: "missing_fields", message: "Name is required" });
  }

  const { data, error } = await supabase.auth.admin.updateUserById(req.user.id, {
    user_metadata: { name }
  });

  if (error) {
    return res.status(400).json({ error: "update_error", message: error.message });
  }

  res.json({ success: true, name: data.user.user_metadata?.name });
});

export async function requireAuth(req, res, next) {
  const token = req.cookies?.sb_access_token;
  if (!token) {
    return res.status(401).json({ error: "unauthorized", message: "Not authenticated" });
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: "lax" });
    return res.status(401).json({ error: "unauthorized", message: "Invalid session" });
  }
  req.user = {
    id: data.user.id,
    email: data.user.email,
    role: data.user.user_metadata?.role || "candidate",
    name: data.user.user_metadata?.name || "",
  };
  next();
}

export default router;
