import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { assessmentsTable, questionsTable, submissionsTable, candidatesTable } from "@workspace/db/schema";
import { eq, avg } from "drizzle-orm";
import { SubmitAssessmentBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const assessments = await db.select().from(assessmentsTable);

  const result = await Promise.all(
    assessments.map(async (a) => {
      const questions = await db
        .select()
        .from(questionsTable)
        .where(eq(questionsTable.assessmentId, a.assessmentId));
      return {
        assessmentId: a.assessmentId,
        title: a.title,
        type: a.type,
        description: a.description,
        durationMinutes: a.durationMinutes,
        totalQuestions: questions.length,
        maxScore: a.maxScore,
      };
    })
  );

  res.json(result);
});

router.get("/:assessmentId", async (req, res) => {
  const { assessmentId } = req.params;

  const [assessment] = await db
    .select()
    .from(assessmentsTable)
    .where(eq(assessmentsTable.assessmentId, assessmentId))
    .limit(1);

  if (!assessment) {
    return res.status(404).json({ error: "not_found", message: "Assessment not found" });
  }

  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.assessmentId, assessmentId));

  res.json({
    assessmentId: assessment.assessmentId,
    title: assessment.title,
    type: assessment.type,
    description: assessment.description,
    durationMinutes: assessment.durationMinutes,
    totalQuestions: questions.length,
    maxScore: assessment.maxScore,
    questions: questions.map((q) => ({
      questionId: q.questionId,
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

    const [assessment] = await db
      .select()
      .from(assessmentsTable)
      .where(eq(assessmentsTable.assessmentId, assessmentId))
      .limit(1);

    if (!assessment) {
      return res.status(404).json({ error: "not_found", message: "Assessment not found" });
    }

    const questions = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.assessmentId, assessmentId));

    let score = 0;
    let maxScore = 0;

    for (const question of questions) {
      maxScore += question.points;
      const answer = body.answers.find((a) => a.questionId === question.questionId);
      if (answer && question.type === "multiple_choice" && answer.selectedOption !== null && answer.selectedOption !== undefined) {
        if (answer.selectedOption === question.correctOption) {
          score += question.points;
        }
      } else if (answer && (question.type === "coding" || question.type === "short_answer")) {
        if (answer.textAnswer && answer.textAnswer.trim().length > 10) {
          score += question.points * 0.7;
        }
      }
    }

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : 0;
    const passed = percentage >= 60;

    await db.insert(submissionsTable).values({
      candidateId: body.candidateId,
      assessmentId,
      score,
      maxScore,
      percentage,
      passed,
    });

    const allSubmissions = await db
      .select()
      .from(submissionsTable)
      .where(eq(submissionsTable.candidateId, body.candidateId));

    const overallScore =
      allSubmissions.length > 0
        ? allSubmissions.reduce((sum, s) => sum + s.percentage, 0) / allSubmissions.length
        : percentage;

    await db
      .update(candidatesTable)
      .set({ overallScore: Math.round(overallScore * 10) / 10 })
      .where(eq(candidatesTable.candidateId, body.candidateId));

    let feedback = "";
    if (percentage >= 85) feedback = "Excellent performance! You are in the top tier of candidates.";
    else if (percentage >= 70) feedback = "Good performance! You have demonstrated strong skills.";
    else if (percentage >= 60) feedback = "Satisfactory performance. Consider strengthening your weak areas.";
    else feedback = "Keep practicing! Review the topic areas and try to improve your score.";

    res.json({
      candidateId: body.candidateId,
      assessmentId,
      score,
      maxScore,
      percentage,
      passed,
      feedback,
    });
  } catch (err: any) {
    res.status(400).json({ error: "validation_error", message: err.message ?? "Invalid input" });
  }
});

export default router;
