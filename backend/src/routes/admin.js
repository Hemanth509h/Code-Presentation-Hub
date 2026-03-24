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

router.post("/users", async (req, res) => {
  const { email, password, role } = req.body;
  if (!["candidate", "recruiter", "admin"].includes(role)) {
    return res.status(400).json({ error: "invalid_role", message: "Role must be candidate, recruiter, or admin" });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { role },
      email_confirm: true,
    });
    if (authError) throw authError;
    res.status(201).json({ success: true, user: authData.user });
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
    const { data: candidates, error } = await supabase.from("candidates").select("*").order("registered_at", { ascending: false });
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

router.get("/recruiters", async (_req, res) => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;
    
    const recruiters = data.users
      .filter((u) => u.user_metadata?.role === "recruiter")
      .map((u) => ({
        recruiter_id: u.id,
        email: u.email,
        company_name: u.user_metadata?.companyName || "",
        designation: u.user_metadata?.designation || "",
        created_at: u.created_at,
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
    res.json(recruiters);
  } catch (err) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

router.post("/recruiters", async (req, res) => {
  const { email, password, companyName, designation } = req.body;
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "recruiter", companyName, designation },
    });
    if (authError) throw authError;

    const recruiter = {
      recruiter_id: authData.user.id,
      email: authData.user.email,
      company_name: companyName,
      designation: designation,
      created_at: authData.user.created_at,
    };

    res.status(201).json({ authUser: authData.user, recruiter });
  } catch (err) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

router.put("/recruiters/:recruiterId", async (req, res) => {
  const { recruiterId } = req.params;
  const { companyName, designation } = req.body;

  try {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(recruiterId);
    if (userError) throw userError;

    const currentMetadata = userData.user.user_metadata || {};
    
    const { data, error } = await supabase.auth.admin.updateUserById(recruiterId, {
      user_metadata: { ...currentMetadata, companyName, designation },
    });
    if (error) throw error;
    
    res.json({
      recruiter_id: data.user.id,
      email: data.user.email,
      company_name: data.user.user_metadata.companyName,
      designation: data.user.user_metadata.designation,
      created_at: data.user.created_at,
    });
  } catch (err) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

export default router;
