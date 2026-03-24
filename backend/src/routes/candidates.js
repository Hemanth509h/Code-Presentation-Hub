import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

function generateCandidateId() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `CND-${num}`;
}

router.post("/register", async (req, res) => {
  try {
    const body = req.body;


    let candidateId = generateCandidateId();
    let attempts = 0;
    while (attempts < 10) {
      const { data } = await supabase
        .from("candidates")
        .select("candidate_id")
        .eq("candidate_id", candidateId)
        .maybeSingle();
      if (!data) break;
      candidateId = generateCandidateId();
      attempts++;
    }

    const { data: candidate, error } = await supabase
      .from("candidates")
      .insert({
        candidate_id: candidateId,
        target_role: body.targetRole,
        skills: body.skills,
        experience_years: body.experienceYears,
      })
      .select()
      .single();

    if (error) throw error;

    const { count } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .eq("candidate_id", candidateId);

    res.status(201).json({
      candidateId: candidate.candidate_id,
      targetRole: candidate.target_role,
      skills: candidate.skills,
      experienceYears: candidate.experience_years,
      registeredAt: candidate.registered_at,
      completedAssessments: count ?? 0,
      overallScore: candidate.overall_score ?? null,
    });
  } catch (err) {
    res.status(400).json({ error: "validation_error", message: err.message ?? "Invalid input" });
  }
});

router.get("/:candidateId", async (req, res) => {
  const { candidateId } = req.params;

  const { data: candidate, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("candidate_id", candidateId)
    .maybeSingle();

  if (error || !candidate) {
    return res.status(404).json({ error: "not_found", message: "Candidate not found" });
  }

  const { count } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("candidate_id", candidateId);

  let rank = null;
  let roleRank = null;
  if (candidate.overall_score !== null && candidate.overall_score !== undefined) {
    const { data: allCandidates } = await supabase
      .from("candidates")
      .select("candidate_id, target_role")
      .not("overall_score", "is", null)
      .order("overall_score", { ascending: false });
    
    const overallIndex = (allCandidates ?? []).findIndex(c => c.candidate_id === candidateId);
    if (overallIndex !== -1) rank = overallIndex + 1;

    const roleCandidates = (allCandidates ?? []).filter(c => c.target_role === candidate.target_role);
    const roleIndex = roleCandidates.findIndex(c => c.candidate_id === candidateId);
    if (roleIndex !== -1) roleRank = roleIndex + 1;
  }

  res.json({
    candidateId: candidate.candidate_id,
    targetRole: candidate.target_role,
    skills: candidate.skills,
    experienceYears: candidate.experience_years,
    registeredAt: candidate.registered_at,
    completedAssessments: count ?? 0,
    overallScore: candidate.overall_score ?? null,
    rank,
    roleRank,
  });
});

router.get("/:candidateId/results", async (req, res) => {
  const { candidateId } = req.params;

  const { data: submissions } = await supabase
    .from("submissions")
    .select("*")
    .eq("candidate_id", candidateId);

  if (!submissions) {
    return res.json({ candidateId, assessments: [], overallScore: null, rank: null });
  }

  const results = await Promise.all(
    submissions.map(async (sub) => {
      const { data: assessment } = await supabase
        .from("assessments")
        .select("*")
        .eq("assessment_id", sub.assessment_id)
        .maybeSingle();

      return {
        assessmentId: sub.assessment_id,
        assessmentTitle: assessment?.title ?? "Unknown",
        assessmentType: assessment?.type ?? "technical",
        score: sub.score,
        maxScore: sub.max_score,
        percentage: sub.percentage,
        completedAt: sub.completed_at,
      };
    })
  );

  const overallScore =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length
      : null;

  res.json({
    candidateId,
    assessments: results,
    overallScore: overallScore !== null ? Math.round(overallScore * 10) / 10 : null,
    rank: null,
  });
});

router.get("/:candidateId/assigned-tests", async (req, res) => {
  const { candidateId } = req.params;
  try {
    const { data: assignments, error: aError } = await supabase
      .from("custom_test_assignments")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("assigned_at", { ascending: false });

    if (aError) throw aError;

    const formatted = [];
    for (const a of assignments || []) {
      const { data: ct } = await supabase.from("custom_tests").select("*, custom_test_questions(count)").eq("custom_test_id", a.custom_test_id).single();
      const { data: cts } = await supabase.from("custom_test_submissions").select("*").eq("custom_test_id", a.custom_test_id).eq("candidate_id", candidateId).maybeSingle();
      
      if (ct) {
        formatted.push({
          customTestId: ct.custom_test_id,
          title: ct.title,
          type: ct.type,
          description: ct.description,
          durationMinutes: ct.duration_minutes,
          questionCount: ct.custom_test_questions?.[0]?.count ?? 0,
          assignedAt: a.assigned_at,
          status: a.status,
          percentage: cts?.percentage ?? null,
          passed: cts?.passed ?? null,
          completedAt: cts?.completed_at ?? null,
        });
      }
    }

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "db_error", message: err.message });
  }
});

export default router;
