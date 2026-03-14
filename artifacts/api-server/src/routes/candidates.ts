import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";
import { RegisterCandidateBody } from "@workspace/api-zod";

const router: IRouter = Router();

function generateCandidateId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `CND-${num}`;
}

router.post("/register", async (req, res) => {
  try {
    const body = RegisterCandidateBody.parse(req.body);

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
  } catch (err: any) {
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
    submissions.map(async (sub: any) => {
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

export default router;
