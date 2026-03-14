import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { candidatesTable, submissionsTable, assessmentsTable } from "@workspace/db/schema";
import { eq, avg, count } from "drizzle-orm";
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
      const existing = await db
        .select()
        .from(candidatesTable)
        .where(eq(candidatesTable.candidateId, candidateId))
        .limit(1);
      if (existing.length === 0) break;
      candidateId = generateCandidateId();
      attempts++;
    }

    const [candidate] = await db
      .insert(candidatesTable)
      .values({
        candidateId,
        targetRole: body.targetRole,
        skills: body.skills,
        experienceYears: body.experienceYears,
      })
      .returning();

    const completedCount = await db
      .select({ count: count() })
      .from(submissionsTable)
      .where(eq(submissionsTable.candidateId, candidateId));

    res.status(201).json({
      candidateId: candidate.candidateId,
      targetRole: candidate.targetRole,
      skills: candidate.skills,
      experienceYears: candidate.experienceYears,
      registeredAt: candidate.registeredAt.toISOString(),
      completedAssessments: completedCount[0]?.count ?? 0,
      overallScore: candidate.overallScore ?? null,
    });
  } catch (err: any) {
    res.status(400).json({ error: "validation_error", message: err.message ?? "Invalid input" });
  }
});

router.get("/:candidateId", async (req, res) => {
  const { candidateId } = req.params;
  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.candidateId, candidateId))
    .limit(1);

  if (!candidate) {
    return res.status(404).json({ error: "not_found", message: "Candidate not found" });
  }

  const submissions = await db
    .select({ count: count() })
    .from(submissionsTable)
    .where(eq(submissionsTable.candidateId, candidateId));

  res.json({
    candidateId: candidate.candidateId,
    targetRole: candidate.targetRole,
    skills: candidate.skills,
    experienceYears: candidate.experienceYears,
    registeredAt: candidate.registeredAt.toISOString(),
    completedAssessments: submissions[0]?.count ?? 0,
    overallScore: candidate.overallScore ?? null,
  });
});

router.get("/:candidateId/results", async (req, res) => {
  const { candidateId } = req.params;

  const submissions = await db
    .select()
    .from(submissionsTable)
    .where(eq(submissionsTable.candidateId, candidateId));

  const results = await Promise.all(
    submissions.map(async (sub) => {
      const [assessment] = await db
        .select()
        .from(assessmentsTable)
        .where(eq(assessmentsTable.assessmentId, sub.assessmentId))
        .limit(1);

      return {
        assessmentId: sub.assessmentId,
        assessmentTitle: assessment?.title ?? "Unknown",
        assessmentType: assessment?.type ?? "technical",
        score: sub.score,
        maxScore: sub.maxScore,
        percentage: sub.percentage,
        completedAt: sub.completedAt.toISOString(),
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
