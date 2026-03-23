import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { pool } from "@workspace/db";

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

  res.json({
    candidateId: candidate.candidate_id,
    targetRole: candidate.target_role,
    skills: candidate.skills,
    experienceYears: candidate.experience_years,
    registeredAt: candidate.registered_at,
    completedAssessments: count ?? 0,
    overallScore: candidate.overall_score ?? null,
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
    const { rows } = await pool.query(
      `SELECT ct.custom_test_id, ct.title, ct.type, ct.description, ct.duration_minutes,
              cta.assigned_at, cta.status,
              cts.percentage, cts.passed, cts.completed_at,
              COUNT(ctq.id) AS question_count
       FROM custom_test_assignments cta
       JOIN custom_tests ct ON cta.custom_test_id = ct.custom_test_id
       LEFT JOIN custom_test_submissions cts
         ON cta.custom_test_id = cts.custom_test_id AND cta.candidate_id = cts.candidate_id
       LEFT JOIN custom_test_questions ctq ON ct.custom_test_id = ctq.custom_test_id
       WHERE cta.candidate_id = $1
       GROUP BY ct.custom_test_id, ct.title, ct.type, ct.description, ct.duration_minutes,
                cta.assigned_at, cta.status, cts.percentage, cts.passed, cts.completed_at
       ORDER BY cta.assigned_at DESC`,
      [candidateId]
    );

    res.json(rows.map((r) => ({
      customTestId: r.custom_test_id,
      title: r.title,
      type: r.type,
      description: r.description,
      durationMinutes: r.duration_minutes,
      questionCount: parseInt(r.question_count),
      assignedAt: r.assigned_at,
      status: r.status,
      percentage: r.percentage,
      passed: r.passed,
      completedAt: r.completed_at,
    })));
  } catch (err) {
    res.status(500).json({ error: "db_error", message: err.message });
  }
});

export default router;
