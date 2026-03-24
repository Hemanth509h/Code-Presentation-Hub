import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { loadData, saveData } from "../utils/storage.js";

const router = Router();

// ─── Persistence Layer ────────────────────────────────────────────────────────
let db = await loadData();

function sync() {
  saveData(db).catch(err => console.error("Sync error:", err));
}

function getShortlist(recruiterId) {
  if (!db.shortlists[recruiterId]) db.shortlists[recruiterId] = [];
  return db.shortlists[recruiterId];
}

function maskId(id) {
  // We now use the real candidate_id as the "alias" per user request
  if (!db.masks[id]) {
    db.masks[id] = id;
    db.revMasks[id] = id;
    sync();
  }
  return db.masks[id];
}

function unMaskId(alias) {
  // If no mapping found, assume the alias IS the real ID (since we changed the logic)
  return db.revMasks[alias] ?? alias;
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
    let query = supabase.from("candidates").select("*").not("overall_score", "is", null);
    if (role && role !== "all") query = query.eq("target_role", role);
    const { data: candidates, error } = await query.order("overall_score", { ascending: false });
    if (error) throw error;

    const recruiterId = req.user.id;
    console.log(`[BlindPool] Fetching for recruiter: ${recruiterId}, role: ${role}`);
    console.log(`[BlindPool] Found ${candidates?.length || 0} candidates with scores in Supabase.`);

    const shortlist = getShortlist(recruiterId);
    const myConnections = Object.values(db.connections).filter(c => c.recruiterId === recruiterId);

    const pool = (candidates ?? []).map((c, idx) => {
      const masked = maskId(c.candidate_id);
      const conn = Object.values(db.connections).find(con => con.candidateId === c.candidate_id && con.recruiterId === recruiterId);
      return {
        rank: idx + 1,
        maskedId: c.candidate_id, // Use real ID instead of masked alias
        targetRole: c.target_role,
        skills: c.skills,
        experienceYears: c.experience_years,
        overallScore: c.overall_score ?? 0,
        isShortlisted: shortlist.includes(masked),
        connectionStatus: conn?.status ?? null,
        connectionId: conn?.id ?? null,
      };
    });

    console.log(`[BlindPool] Returning ${pool.length} masked candidates.`);
    res.json(pool);
  } catch (err) {
    res.status(500).json({ error: "db_error", message: err.message });
  }
});

router.post("/shortlist/:maskedId", requireAuth, (req, res) => {
  const { maskedId } = req.params;
  const recruiterId = req.user.id;
  const shortlist = getShortlist(recruiterId);
  if (!shortlist.includes(maskedId)) {
    shortlist.push(maskedId);
    sync();
  }
  res.json({ success: true, maskedId, shortlisted: true });
});

router.delete("/shortlist/:maskedId", requireAuth, (req, res) => {
  const { maskedId } = req.params;
  const recruiterId = req.user.id;
  const shortlist = getShortlist(recruiterId);
  const idx = shortlist.indexOf(maskedId);
  if (idx !== -1) {
    shortlist.splice(idx, 1);
    sync();
  }
  res.json({ success: true, maskedId, shortlisted: false });
});

router.get("/shortlist", requireAuth, async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const shortlistedMasked = [...getShortlist(recruiterId)];
    // Enrich with live data (still masked)
    const { data: allCandidates } = await supabase.from("candidates").select("*");
    const myConnections = [...connectionStore.values()].filter(c => c.recruiterId === recruiterId);

    const items = shortlistedMasked.map(masked => {
      const realId = unMaskId(masked);
      const c = (allCandidates ?? []).find(x => x.candidate_id === realId);
      const conn = Object.values(db.connections).find(con => con.candidateId === realId && con.recruiterId === recruiterId);
      return {
        maskedId: masked,
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
router.post("/connect/:maskedId", requireAuth, (req, res) => {
  const { maskedId } = req.params;
  const { message } = req.body;
  const recruiterId = req.user.id;
  const realId = unMaskId(maskedId);

  if (!realId) return res.status(404).json({ error: "not_found", message: "Candidate alias not found" });

  // Check for existing connection
  const existing = Object.values(db.connections).find(
    c => c.recruiterId === recruiterId && c.candidateId === realId
  );
  if (existing) return res.status(409).json({ error: "conflict", message: "Interest already sent" });

  const id = `CONN-${db.connectionCounter++}`;
  db.connections[id] = {
    id,
    recruiterId,
    candidateId: realId,
    maskedId,
    message: message || "",
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  sync();

  res.status(201).json({ success: true, connectionId: id });
});

router.get("/connections", requireAuth, (req, res) => {
  const recruiterId = req.user.id;
  const myConns = Object.values(db.connections).filter(c => c.recruiterId === recruiterId);

  const result = myConns.map(c => ({
    connectionId: c.id,
    maskedId: c.maskedId,
    // Only reveal real ID on acceptance
    realCandidateId: c.status === "accepted" ? c.candidateId : null,
    status: c.status,
    message: c.message,
    createdAt: c.createdAt,
  }));

  res.json(result);
});

// ─── Candidate: view pending requests ────────────────────────────────────────
router.get("/pending-for-candidate/:candidateId", (req, res) => {
  const { candidateId } = req.params;
  const pending = Object.values(db.connections)
    .filter(c => c.candidateId === candidateId)
    .map(c => ({
      connectionId: c.id,
      recruiterAlias: `Recruiter ${c.recruiterId.substring(0, 6)}`,
      message: c.message,
      status: c.status,
      createdAt: c.createdAt,
    }));
  res.json(pending);
});

router.post("/respond/:connectionId", (req, res) => {
  const { connectionId } = req.params;
  const { decision } = req.body; // "accepted" | "declined"

  const conn = db.connections[connectionId];
  if (!conn) return res.status(404).json({ error: "not_found" });
  if (!["accepted", "declined"].includes(decision)) {
    return res.status(400).json({ error: "Invalid decision. Use 'accepted' or 'declined'." });
  }

  conn.status = decision;
  sync();
  res.json({ success: true, connectionId, status: decision });
});

export default router;
