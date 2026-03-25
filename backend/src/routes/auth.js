import { Router } from "express";
import { supabaseAnon } from "../lib/supabase-anon.js";
import { supabase } from "../lib/supabase.js";

const router = Router();

const COOKIE_NAME = "sb_access_token";
const REFRESH_COOKIE_NAME = "sb_refresh_token";
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days
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
  res.cookie(REFRESH_COOKIE_NAME, data.session.refresh_token, COOKIE_OPTS);

  const user = data.user;
  res.json({
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role || "candidate",
    name: user.user_metadata?.name || "",
    candidateId: user.user_metadata?.candidate_id || null,
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
  res.clearCookie(REFRESH_COOKIE_NAME, { httpOnly: true, sameSite: "lax" });
  res.json({ success: true });
});

router.get("/me", async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME];

  if (!token && !refreshToken) {
    return res.status(401).json({ error: "unauthorized", message: "Not authenticated" });
  }

  // Try access token first
  if (token) {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) {
      const user = data.user;
      return res.json({
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || "candidate",
        name: user.user_metadata?.name || "",
        candidateId: user.user_metadata?.candidate_id || null,
      });
    }
  }

  // Access token failed — try refreshing with refresh token
  if (refreshToken) {
    const { data: refreshData, error: refreshError } = await supabaseAnon.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (!refreshError && refreshData?.session && refreshData?.user) {
      // Re-set both cookies with the new tokens
      res.cookie(COOKIE_NAME, refreshData.session.access_token, COOKIE_OPTS);
      res.cookie(REFRESH_COOKIE_NAME, refreshData.session.refresh_token, COOKIE_OPTS);

      const user = refreshData.user;
      return res.json({
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || "candidate",
        name: user.user_metadata?.name || "",
        candidateId: user.user_metadata?.candidate_id || null,
      });
    }
  }

  // Both failed — clear cookies and return 401
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: "lax" });
  res.clearCookie(REFRESH_COOKIE_NAME, { httpOnly: true, sameSite: "lax" });
  return res.status(401).json({ error: "unauthorized", message: "Session expired. Please log in again." });
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

router.put("/candidate-id", requireAuth, async (req, res) => {
  const { candidateId } = req.body;
  if (!candidateId) {
    return res.status(400).json({ error: "missing_fields", message: "Candidate ID is required" });
  }

  const { data, error } = await supabase.auth.admin.updateUserById(req.user.id, {
    user_metadata: { ...req.user.user_metadata, candidate_id: candidateId }
  });

  if (error) {
    return res.status(400).json({ error: "update_error", message: error.message });
  }

  res.json({ success: true, candidateId });
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
    candidateId: data.user.user_metadata?.candidate_id || null,
  };
  next();
}

export default router;
