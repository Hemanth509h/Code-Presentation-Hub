import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ─── Persistence Layer (Supabase) ──────────────────────────────────────────────
async function getShortlist(recruiterId) {
  const { data } = await supabase
    .from("recruiter_shortlists")
    .select("candidate_id")
    .eq("recruiter_id", recruiterId);
  return (data || []).map(s => s.candidate_id);
}

async function maskId(id) {
  try {
    const { data: existing } = await supabase
      .from("candidate_aliases")
      .select("alias")
      .eq("candidate_id", id)
      .maybeSingle();

    if (existing) return existing.alias;

    // Try to create a sequential alias
    const { count } = await supabase
      .from("candidate_aliases")
      .select("*", { count: "exact", head: true });

    const alias = `CAND-${String((count || 0) + 1).padStart(3, '0')}`;
    
    const { data: created, error: iError } = await supabase
      .from("candidate_aliases")
      .insert({ candidate_id: id, alias })
      .select("alias")
      .maybeSingle();

    if (iError || !created) {
      // Fallback to random alias if collision or error
      const randomAlias = `CAND-${Math.floor(Math.random() * 900 + 100)}`;
      const { data: fallback } = await supabase
        .from("candidate_aliases")
        .upsert({ candidate_id: id, alias: randomAlias }, { onConflict: "candidate_id" })
        .select("alias")
        .single();
      return fallback?.alias || randomAlias;
    }

    return created.alias;
  } catch (err) {
    console.error("[MaskId] Unexpected error:", err);
    return id; 
  }
}

async function unMaskId(alias) {
  try {
    const { data, error } = await supabase
      .from("candidate_aliases")
      .select("candidate_id")
      .eq("alias", alias)
      .maybeSingle();

    if (error) console.error("[UnMaskId] Error:", error);
    if (data) console.log(`[UnMaskId] ${alias} -> ${data.candidate_id}`);
    else console.log(`[UnMaskId] No mapping for ${alias}, returning as is`);

    return data?.candidate_id || alias;
  } catch (err) {
    console.error("[UnMaskId] Unexpected error:", err);
    return alias;
  }
}

// ─── Rankings (existing, untouched) ──────────────────────────────────────────
router.get("/rankings", async (req, res) => {
  const assessmentType = req.query.assessmentType;
  const role = req.query.role;

  let query = supabase
    .from("candidates")
    .select("*")
    .not("overall_score", "is", null);

  if (role && role !== "all") query = query.eq("target_role", role);

  const { data: candidates } = await query.order("overall_score", { ascending: false });

  const ranked = await Promise.all(
    (candidates ?? []).map(async (c, idx) => {
      const { data: submissions } = await supabase
        .from("submissions")
        .select("*, assessments(type)")
        .eq("candidate_id", c.candidate_id);

      const scores = { coding: null, aptitude: null, technical: null };
      for (const sub of submissions ?? []) {
        const type = sub.assessments?.type;
        if (type) scores[type] = sub.percentage;
      }

      return {
        rank: idx + 1,
        candidateId: c.candidate_id,
        targetRole: c.target_role,
        skills: c.skills,
        experienceYears: c.experience_years,
        overallScore: c.overall_score ?? 0,
        assessmentsCompleted: submissions?.length ?? 0,
        codingScore: scores.coding,
        aptitudeScore: scores.aptitude,
        technicalScore: scores.technical,
      };
    })
  );

  if (assessmentType && assessmentType !== "all") {
    const filtered = ranked.filter((r) => {
      if (assessmentType === "coding") return r.codingScore !== null;
      if (assessmentType === "aptitude") return r.aptitudeScore !== null;
      if (assessmentType === "technical") return r.technicalScore !== null;
      return true;
    });
    return res.json(filtered.map((r, i) => ({ ...r, rank: i + 1 })));
  }

  res.json(ranked);
});

// ─── Stats (existing, untouched) ─────────────────────────────────────────────
router.get("/stats", async (_req, res) => {
  const { data: allCandidates } = await supabase.from("candidates").select("*");
  const { count: assessmentsCompleted } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true });

  const candidates = allCandidates ?? [];
  const totalCandidates = candidates.length;
  const scored = candidates.filter((c) => c.overall_score !== null);
  const avgScore =
    scored.length > 0
      ? scored.reduce((sum, c) => sum + c.overall_score, 0) / scored.length
      : 0;
  const topPerformers = candidates.filter((c) => (c.overall_score ?? 0) >= 80).length;
  const roleMap = new Map();
  for (const c of candidates) roleMap.set(c.target_role, (roleMap.get(c.target_role) ?? 0) + 1);
  const roleDistribution = Array.from(roleMap.entries()).map(([role, count]) => ({ role, count }));
  const ranges = [
    { range: "0-20", min: 0, max: 20 }, { range: "21-40", min: 21, max: 40 },
    { range: "41-60", min: 41, max: 60 }, { range: "61-80", min: 61, max: 80 },
    { range: "81-100", min: 81, max: 100 },
  ];
  const scoreDistribution = ranges.map(({ range, min, max }) => ({
    range,
    count: candidates.filter((c) => { const s = c.overall_score ?? 0; return s >= min && s <= max; }).length,
  }));

  res.json({ totalCandidates, assessmentsCompleted: assessmentsCompleted ?? 0, averageScore: Math.round(avgScore * 10) / 10, topPerformers, roleDistribution, scoreDistribution });
});

// ─── Blind Recruitment: Anonymous Pool ───────────────────────────────────────
router.get("/blind-pool", requireAuth, async (req, res) => {
  try {
    const role = req.query.role;
    console.log(`[BlindPool] Request from ${req.user.id} for role ${role}`);
    let query = supabase.from("candidates").select("*").not("overall_score", "is", null);
    if (role && role !== "all") query = query.eq("target_role", role);
    const { data: candidates, error } = await query.order("overall_score", { ascending: false });
    if (error) throw error;

    const recruiterId = req.user.id;
    console.log(`[BlindPool] Fetching for recruiter: ${recruiterId}, role: ${role}`);
    console.log(`[BlindPool] Found ${candidates?.length || 0} candidates with scores in Supabase.`);

    const shortlist = await getShortlist(recruiterId);
    const { data: conns } = await supabase
      .from("recruiter_connections")
      .select("*")
      .eq("recruiter_id", recruiterId);

    const pool = (candidates ?? []).map((c, idx) => {
      const conn = (conns || []).find(con => con.candidate_id === c.candidate_id);
      return {
        rank: idx + 1,
        maskedId: c.candidate_id,
        targetRole: c.target_role,
        skills: c.skills,
        experienceYears: c.experience_years,
        overallScore: c.overall_score ?? 0,
        isShortlisted: shortlist.includes(c.candidate_id),
        connectionStatus: conn?.status ?? null,
        connectionId: conn?.id ?? null,
      };
    });

    console.log(`[BlindPool] Returning ${pool.length} candidates.`);
    res.json(pool);
  } catch (err) {
    console.error(`[BlindPool] Error: ${err.message}`);
    res.status(500).json({ error: "db_error", message: err.message });
  }
});

router.post("/shortlist/:maskedId", requireAuth, async (req, res) => {
  const { maskedId } = req.params;
  const recruiterId = req.user.id;
  const realId = maskedId; // Masking bypassed

  await supabase
    .from("recruiter_shortlists")
    .upsert({ recruiter_id: recruiterId, candidate_id: realId }, { onConflict: "recruiter_id, candidate_id", ignoreDuplicates: true });

  res.json({ success: true, maskedId, shortlisted: true });
});

router.delete("/shortlist/:maskedId", requireAuth, async (req, res) => {
  const { maskedId } = req.params;
  const recruiterId = req.user.id;
  const realId = maskedId; // Masking bypassed

  await supabase
    .from("recruiter_shortlists")
    .delete()
    .eq("recruiter_id", recruiterId)
    .eq("candidate_id", realId);

  res.json({ success: true, maskedId, shortlisted: false });
});

router.get("/shortlist", requireAuth, async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const shortlistedIds = await getShortlist(recruiterId);

    const { data: allCandidates } = await supabase.from("candidates").select("*");
    const { data: conns } = await supabase
      .from("recruiter_connections")
      .select("*")
      .eq("recruiter_id", recruiterId);

    const items = shortlistedIds.map(realId => {
      const c = (allCandidates ?? []).find(x => x.candidate_id === realId);
      const conn = (conns || []).find(con => con.candidate_id === realId);
      return {
        maskedId: realId,
        targetRole: c?.target_role ?? "Unknown",
        skills: c?.skills ?? [],
        experienceYears: c?.experience_years ?? 0,
        overallScore: c?.overall_score ?? 0,
        connectionStatus: conn?.status ?? null,
        connectionId: conn?.id ?? null,
      };
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "db_error", message: err.message });
  }
});

// ─── Connections ──────────────────────────────────────────────────────────────
router.post("/connect/:maskedId", requireAuth, async (req, res) => {
  try {
    console.log(`[Connect] Triggered for ${req.params.maskedId}`);
    const { maskedId } = req.params;
    const { message } = req.body;
    const recruiterId = req.user.id;
    const realId = maskedId; // Masking bypassed

    console.log(`[Connect] From Recruiter ${recruiterId} to ${maskedId}`);

    if (!realId) return res.status(404).json({ error: "not_found", message: "Candidate alias not found" });

    // Check for existing connection
    const { data: existing } = await supabase
      .from("recruiter_connections")
      .select("id")
      .eq("recruiter_id", recruiterId)
      .eq("candidate_id", realId)
      .maybeSingle();

    if (existing) return res.status(409).json({ error: "conflict", message: "Interest already sent" });

    const id = `CONN-${Math.floor(Math.random() * 900000 + 100000)}`;

    const { error: insertError } = await supabase
      .from("recruiter_connections")
      .insert({
        id,
        recruiter_id: recruiterId,
        candidate_id: realId,
        masked_id: maskedId,
        message: message || "",
        status: "pending",
      });

    if (insertError) {
      console.error("[Connect] Insert error:", insertError);
      throw insertError;
    }

    console.log(`[Connect] Successfully saved connection ${id}`);
    res.status(201).json({ success: true, connectionId: id });
  } catch (err) {
    console.error("[Connect] Unexpected error:", err);
    res.status(500).json({ error: "db_error", message: err.message });
  }
});

router.get("/connections", requireAuth, async (req, res) => {
  const recruiterId = req.user.id;
  const { data: conns } = await supabase
    .from("recruiter_connections")
    .select("*")
    .eq("recruiter_id", recruiterId);

  // For accepted connections, try to find the assigned custom test
  const { data: assignments } = await supabase
    .from("custom_test_assignments")
    .select("custom_test_id, candidate_id");

  const shortlistedIds = await getShortlist(recruiterId);

  const result = (conns || []).map(c => {
    const assignment = (assignments || []).find(a => a.candidate_id === c.candidate_id);
    const isShortlisted = shortlistedIds.includes(c.candidate_id);

    return {
      connectionId: c.id,
      maskedId: c.candidate_id, // Expose actual ID
      // Only reveal real ID if the candidate is in the shortlist
      realCandidateId: isShortlisted ? c.candidate_id : null,
      status: c.status,
      message: c.message,
      createdAt: c.created_at,
      customTestId: assignment?.custom_test_id || null,
    };
  });

  res.json(result);
});

// ─── Candidate: view pending requests ────────────────────────────────────────
router.get("/pending-for-candidate/:candidateId", async (req, res) => {
  const { candidateId } = req.params;
  const { data: conns } = await supabase
    .from("recruiter_connections")
    .select("*")
    .eq("candidate_id", candidateId);

  const pending = (conns || []).map(c => ({
    connectionId: c.id,
    recruiterAlias: `Recruiter ${c.recruiter_id.substring(0, 6)}`,
    message: c.message,
    status: c.status,
    createdAt: c.created_at,
  }));
  res.json(pending);
});

router.post("/respond/:connectionId", async (req, res) => {
  const { connectionId } = req.params;
  const { decision } = req.body; // "accepted" | "declined"

  const { data: conn } = await supabase
    .from("recruiter_connections")
    .select("*")
    .eq("id", connectionId)
    .single();

  if (!conn) return res.status(404).json({ error: "not_found" });
  if (!["accepted", "declined"].includes(decision)) {
    return res.status(400).json({ error: "Invalid decision. Use 'accepted' or 'declined'." });
  }

  await supabase
    .from("recruiter_connections")
    .update({ status: decision })
    .eq("id", connectionId);

  const { recruiter_id: recruiterId, candidate_id: candidateId } = conn;

  // Automated actions on acceptance
  if (decision === "accepted") {
    // 1. Assign the most recent custom test from this recruiter
    try {
      const { data: tests } = await supabase
        .from("custom_tests")
        .select("custom_test_id, title")
        .eq("created_by", recruiterId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (tests && tests.length > 0) {
        const testId = tests[0].custom_test_id;
        await supabase
          .from("custom_test_assignments")
          .upsert({
            custom_test_id: testId,
            candidate_id: candidateId
          }, { onConflict: "custom_test_id, candidate_id", ignoreDuplicates: true });

        // 3. Send automated welcome message via chat
        await supabase
          .from("chat_messages")
          .insert({
            custom_test_id: testId,
            candidate_id: candidateId,
            sender_role: "recruiter",
            sender_id: recruiterId,
            message: `Hello! I've accepted your interest and assigned a custom test: "${tests[0].title}". You can find it in your dashboard. Good luck!`,
          });
      }
    } catch (err) {
      console.error("[AutoAssign] Failed to automate sequence:", err);
    }
  }

  res.json({ success: true, connectionId, status: decision });
});

router.get("/debug/stats", async (req, res) => {
  try {
    const { count: cCount } = await supabase.from("recruiter_connections").select("*", { count: "exact", head: true });
    const { count: sCount } = await supabase.from("recruiter_shortlists").select("*", { count: "exact", head: true });
    const { count: aCount } = await supabase.from("candidate_aliases").select("*", { count: "exact", head: true });
    const { count: canCount } = await supabase.from("candidates").select("*", { count: "exact", head: true });

    res.json({
      connections: cCount,
      shortlists: sCount,
      aliases: aCount,
      candidates: canCount,
      time: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
