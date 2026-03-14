import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

router.get("/rankings", async (req, res) => {
  const assessmentType = req.query.assessmentType as string | undefined;

  const { data: candidates } = await supabase
    .from("candidates")
    .select("*")
    .not("overall_score", "is", null)
    .order("overall_score", { ascending: false });

  const ranked = await Promise.all(
    (candidates ?? []).map(async (c: any, idx: number) => {
      const { data: submissions } = await supabase
        .from("submissions")
        .select("*, assessments(type)")
        .eq("candidate_id", c.candidate_id);

      const scores: Record<string, number | null> = { coding: null, aptitude: null, technical: null };
      for (const sub of submissions ?? []) {
        const type = (sub as any).assessments?.type;
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

router.get("/stats", async (_req, res) => {
  const { data: allCandidates } = await supabase.from("candidates").select("*");
  const { count: assessmentsCompleted } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true });

  const candidates = allCandidates ?? [];
  const totalCandidates = candidates.length;

  const scored = candidates.filter((c: any) => c.overall_score !== null);
  const avgScore = scored.length > 0
    ? scored.reduce((sum: number, c: any) => sum + c.overall_score, 0) / scored.length
    : 0;

  const topPerformers = candidates.filter((c: any) => (c.overall_score ?? 0) >= 80).length;

  const roleMap = new Map<string, number>();
  for (const c of candidates) {
    roleMap.set((c as any).target_role, (roleMap.get((c as any).target_role) ?? 0) + 1);
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
    count: candidates.filter((c: any) => {
      const s = c.overall_score ?? 0;
      return s >= min && s <= max;
    }).length,
  }));

  res.json({
    totalCandidates,
    assessmentsCompleted: assessmentsCompleted ?? 0,
    averageScore: Math.round(avgScore * 10) / 10,
    topPerformers,
    roleDistribution,
    scoreDistribution,
  });
});

export default router;
