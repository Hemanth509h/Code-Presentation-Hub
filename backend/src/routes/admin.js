import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.get("/users", async (_req, res) => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
    if (error) throw error;

    const users = data.users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.user_metadata?.role || "candidate",
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at,
      emailConfirmed: !!u.email_confirmed_at,
    }));

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

router.patch("/users/:userId/role", async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!["candidate", "recruiter", "admin"].includes(role)) {
    return res.status(400).json({ error: "invalid_role", message: "Role must be candidate, recruiter, or admin" });
  }

  try {
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role },
    });
    if (error) throw error;

    res.json({
      id: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata?.role || "candidate",
    });
  } catch (err) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

router.delete("/users/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

export default router;
