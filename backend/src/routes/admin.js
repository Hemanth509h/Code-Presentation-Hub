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

router.get("/candidates", async (_req, res) => {
  try {
    const { data: candidates, error } = await supabase.from("candidates").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

router.post("/candidates", async (req, res) => {
  const { email, password, targetRole, experienceYears, skills } = req.body;
  try {
    // 1. Create the auth user under the hood
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "candidate" },
    });
    if (authError) throw authError;

    // 2. Create the associated candidate profile
    const candidateId = `CAND-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: candidate, error: dbError } = await supabase
      .from("candidates")
      .insert({
        candidate_id: candidateId,
        target_role: targetRole,
        experience_years: parseInt(experienceYears) || 0,
        skills: Array.isArray(skills) ? skills : [skills],
      })
      .select()
      .single();
    if (dbError) throw dbError;

    res.status(201).json({ authUser: authData.user, candidate });
  } catch (err) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

router.put("/candidates/:candidateId", async (req, res) => {
  const { candidateId } = req.params;
  const { targetRole, experienceYears, skills } = req.body;

  try {
    const { data, error } = await supabase
      .from("candidates")
      .update({
        target_role: targetRole,
        experience_years: parseInt(experienceYears) || 0,
        skills: Array.isArray(skills) ? skills : [skills],
      })
      .eq("candidate_id", candidateId)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

export default router;
