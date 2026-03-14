import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { candidatesTable, submissionsTable, assessmentsTable } from "@workspace/db/schema";
import { eq, desc, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/rankings", async (req, res) => {
  const assessmentType = req.query.assessmentType as string | undefined;

  const candidates = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.overallScore, candidatesTable.overallScore))
    .orderBy(desc(candidatesTable.overallScore));

  const ranked = await Promise.all(
    candidates.map(async (c, idx) => {
      const submissions = await db
        .select()
        .from(submissionsTable)
        .where(eq(submissionsTable.candidateId, c.candidateId));

      const scores: Record<string, number | null> = {
        coding: null,
        aptitude: null,
        technical: null,
      };

      for (const sub of submissions) {
        const [assessment] = await db
          .select()
          .from(assessmentsTable)
          .where(eq(assessmentsTable.assessmentId, sub.assessmentId))
          .limit(1);
        if (assessment) {
          scores[assessment.type] = sub.percentage;
        }
      }

      return {
        rank: idx + 1,
        candidateId: c.candidateId,
        targetRole: c.targetRole,
        skills: c.skills,
        experienceYears: c.experienceYears,
        overallScore: c.overallScore ?? 0,
        assessmentsCompleted: submissions.length,
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

router.get("/stats", async (_req, res) => {
  const allCandidates = await db.select().from(candidatesTable);
  const allSubmissions = await db.select().from(submissionsTable);

  const totalCandidates = allCandidates.length;
  const assessmentsCompleted = allSubmissions.length;

  const avgScore =
    allCandidates.length > 0
      ? allCandidates.reduce((sum, c) => sum + (c.overallScore ?? 0), 0) / allCandidates.filter((c) => c.overallScore !== null).length || 0
      : 0;

  const topPerformers = allCandidates.filter((c) => (c.overallScore ?? 0) >= 80).length;

  const roleMap = new Map<string, number>();
  for (const c of allCandidates) {
    roleMap.set(c.targetRole, (roleMap.get(c.targetRole) ?? 0) + 1);
  }
  const roleDistribution = Array.from(roleMap.entries()).map(([role, count]) => ({ role, count }));

  const ranges = [
    { range: "0-20", min: 0, max: 20 },
    { range: "21-40", min: 21, max: 40 },
    { range: "41-60", min: 41, max: 60 },
    { range: "61-80", min: 61, max: 80 },
    { range: "81-100", min: 81, max: 100 },
  ];

  const scoreDistribution = ranges.map(({ range, min, max }) => ({
    range,
    count: allCandidates.filter((c) => {
      const s = c.overallScore ?? 0;
      return s >= min && s <= max;
    }).length,
  }));

  res.json({
    totalCandidates,
    assessmentsCompleted,
    averageScore: Math.round(avgScore * 10) / 10,
    topPerformers,
    roleDistribution,
    scoreDistribution,
  });
});

export default router;
