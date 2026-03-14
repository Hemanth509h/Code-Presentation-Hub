import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";
import { SubmitAssessmentBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const { data: assessments, error } = await supabase
    .from("assessments")
    .select("*");

  if (error) return res.status(500).json({ error: "db_error", message: error.message });

  const result = await Promise.all(
    (assessments ?? []).map(async (a: any) => {
      const { count } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("assessment_id", a.assessment_id);
      return {
        assessmentId: a.assessment_id,
        title: a.title,
        type: a.type,
        description: a.description,
        durationMinutes: a.duration_minutes,
        totalQuestions: count ?? 0,
        maxScore: a.max_score,
      };
    })
  );

  res.json(result);
});

router.get("/:assessmentId", async (req, res) => {
  const { assessmentId } = req.params;

  const { data: assessment } = await supabase
    .from("assessments")
    .select("*")
    .eq("assessment_id", assessmentId)
    .maybeSingle();

  if (!assessment) {
    return res.status(404).json({ error: "not_found", message: "Assessment not found" });
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("assessment_id", assessmentId);

  res.json({
    assessmentId: assessment.assessment_id,
    title: assessment.title,
    type: assessment.type,
    description: assessment.description,
    durationMinutes: assessment.duration_minutes,
    totalQuestions: questions?.length ?? 0,
    maxScore: assessment.max_score,
    questions: (questions ?? []).map((q: any) => ({
      questionId: q.question_id,
      text: q.text,
      type: q.type,
      options: q.options ?? null,
      points: q.points,
    })),
  });
});

router.post("/:assessmentId/submit", async (req, res) => {
  const { assessmentId } = req.params;
  try {
    const body = SubmitAssessmentBody.parse(req.body);

    const { data: assessment } = await supabase
      .from("assessments")
      .select("*")
      .eq("assessment_id", assessmentId)
      .maybeSingle();

    if (!assessment) {
      return res.status(404).json({ error: "not_found", message: "Assessment not found" });
    }

    const { data: questions } = await supabase
      .from("questions")
      .select("*")
      .eq("assessment_id", assessmentId);

    let score = 0;
    let maxScore = 0;

    for (const question of questions ?? []) {
      maxScore += question.points;
      const answer = body.answers.find((a: any) => a.questionId === question.question_id);
      if (answer && question.type === "multiple_choice" && answer.selectedOption != null) {
        if (answer.selectedOption === question.correct_option) score += question.points;
      } else if (answer && (question.type === "coding" || question.type === "short_answer")) {
        if (answer.textAnswer && answer.textAnswer.trim().length > 10) score += question.points * 0.7;
      }
    }

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : 0;
    const passed = percentage >= 60;

    await supabase.from("submissions").insert({
      candidate_id: body.candidateId,
      assessment_id: assessmentId,
      score,
      max_score: maxScore,
      percentage,
      passed,
    });

    const { data: allSubmissions } = await supabase
      .from("submissions")
      .select("percentage")
      .eq("candidate_id", body.candidateId);

    const overallScore =
      allSubmissions && allSubmissions.length > 0
        ? allSubmissions.reduce((sum: number, s: any) => sum + s.percentage, 0) / allSubmissions.length
        : percentage;

    await supabase
      .from("candidates")
      .update({ overall_score: Math.round(overallScore * 10) / 10 })
      .eq("candidate_id", body.candidateId);

    let feedback = "";
    if (percentage >= 85) feedback = "Excellent performance! You are in the top tier of candidates.";
    else if (percentage >= 70) feedback = "Good performance! You have demonstrated strong skills.";
    else if (percentage >= 60) feedback = "Satisfactory performance. Consider strengthening your weak areas.";
    else feedback = "Keep practicing! Review the topic areas and try to improve your score.";

    res.json({ candidateId: body.candidateId, assessmentId, score, maxScore, percentage, passed, feedback });
  } catch (err: any) {
    res.status(400).json({ error: "validation_error", message: err.message ?? "Invalid input" });
  }
});

export default router;
