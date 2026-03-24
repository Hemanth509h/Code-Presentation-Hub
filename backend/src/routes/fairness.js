import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { anonymizeCandidates } from "../utils/anonymize.js";

const router = Router();

/**
 * Calculates fairness metrics from a set of candidate summaries.
 */
function calculateFairnessMetrics(candidates) {
  if (!candidates.length) return null;

  const scores = candidates.map(c => c.averageScore);
  const exps = candidates.map(c => c.experience_years);

  // 1. Score Variance (Standard Deviation)
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // 2. Experience-Score Correlation (Pearson)
  const n = scores.length;
  if (n < 2) return { scoreStdDev: Math.round(stdDev * 10) / 10, expCorrelation: 0, biasScore: 0, impactRatios: [] };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    const x = exps[i];
    const y = scores[i];
    sumX += x; sumY += y; sumXY += (x * y);
    sumX2 += (x * x); sumY2 += (y * y);
  }
  const numerator = (n * sumXY) - (sumX * sumY);
  const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));
  const correlation = denominator === 0 ? 0 : numerator / denominator;

  // 3. Bias Detection Score (0-100, where 100 is perfectly unbiased/neutral)
  // Higher correlation with experience might indicate "seniority bias" if the role is junior.
  // We'll use a simplified formula: 100 - (abs(correlation) * 20).
  const biasScore = Math.max(0, 100 - Math.abs(correlation) * 25);

  // 4. Simulated Impact Ratios (for demonstration)
  // Divide candidates into two "anonymized cohorts" to show selection parity.
  const half = Math.ceil(n / 2);
  const cohortA = candidates.slice(0, half);
  const cohortB = candidates.slice(half);
  const passA = cohortA.filter(c => c.passRate >= 60).length / cohortA.length;
  const passB = cohortB.filter(c => c.passRate >= 60).length / (cohortB.length || 1);
  const air = passA === 0 ? 0 : passB / passA;

  return {
    scoreStdDev: Math.round(stdDev * 10) / 10,
    expCorrelation: Math.round(correlation * 100) / 100,
    biasScore: Math.round(biasScore),
    impactRatio: Math.round(air * 100) / 100,
    neutralityIndex: Math.round((1 - Math.abs(correlation)) * 100),
  };
}

// GET /api/fairness/results — all raw anonymized submissions (for table view)
router.get("/results", async (req, res) => {
  try {
    const { data: submissions, error: sError } = await supabase
      .from("custom_test_submissions")
      .select("*, custom_tests(title)")
      .order("completed_at", { ascending: false });

    if (sError) throw sError;

    const rows = (submissions || []).map(s => ({
      custom_test_id: s.custom_test_id,
      test_title: s.custom_tests?.title || "Unknown Test",
      candidate_id: s.candidate_id,
      score: s.score,
      max_score: s.max_score,
      percentage: s.percentage,
      passed: s.passed,
      completed_at: s.completed_at,
    }));

    const anonymizedResults = anonymizeCandidates(rows);
    res.json(anonymizedResults);
  } catch (error) {
    console.error("Error fetching fairness results:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/fairness/summary — per-candidate aggregated stats (anonymous)
router.get("/summary", async (req, res) => {
  try {
    const { data: candidatesMeta, error: cError } = await supabase
      .from("candidates")
      .select("candidate_id, experience_years");

    if (cError) throw cError;

    const { data: submissions, error: sError } = await supabase
      .from("custom_test_submissions")
      .select("*, custom_tests(title)")
      .order("completed_at", { ascending: false });

    if (sError) throw sError;

    const rows = (submissions || []).map(s => ({
      custom_test_id: s.custom_test_id,
      test_title: s.custom_tests?.title || "Unknown Test",
      candidate_id: s.candidate_id,
      score: s.score,
      max_score: s.max_score,
      percentage: s.percentage,
      passed: s.passed,
      completed_at: s.completed_at,
    }));

    // Build per-candidate aggregation (before masking, key by real id)
    const candidateStats = {};
    for (const row of rows) {
      const id = row.candidate_id;
      if (!candidateStats[id]) {
        const meta = (candidatesMeta || []).find(m => m.candidate_id === id);
        candidateStats[id] = {
          candidate_id: id,
          experience_years: meta?.experience_years || 0,
          tests: [],
          totalTests: 0,
          passed: 0,
          failed: 0,
          totalScore: 0,
          totalMaxScore: 0,
          percentages: [],
          lastActivity: null,
        };
      }
      const c = candidateStats[id];
      c.totalTests++;
      c.tests.push({
        test_title: row.test_title,
        score: row.score,
        max_score: row.max_score,
        percentage: row.percentage,
        passed: row.passed,
        completed_at: row.completed_at,
      });
      if (row.passed) c.passed++; else c.failed++;
      c.totalScore += row.score;
      c.totalMaxScore += row.max_score;
      c.percentages.push(row.percentage);
      if (!c.lastActivity || new Date(row.completed_at) > new Date(c.lastActivity)) {
        c.lastActivity = row.completed_at;
      }
    }

    // Convert map to array and compute derived stats
    let summaries = Object.values(candidateStats).map(c => ({
      ...c,
      averageScore: c.percentages.length
        ? Math.round((c.percentages.reduce((a, b) => a + b, 0) / c.percentages.length) * 10) / 10
        : 0,
      passRate: c.totalTests > 0 ? Math.round((c.passed / c.totalTests) * 100) : 0,
    }));

    // Sort by average score descending for ranking
    summaries.sort((a, b) => b.averageScore - a.averageScore);
    summaries = summaries.map((s, i) => ({ ...s, rank: i + 1 }));

    // Calculate Fairness Metrics
    const fairnessMetrics = calculateFairnessMetrics(summaries);

    // Anonymize the candidate_id field
    const anonymized = anonymizeCandidates(summaries);

    // Overall stats
    const overall = {
      totalCandidates: anonymized.length,
      totalEvaluations: rows.length,
      globalAvgScore: anonymized.length
        ? Math.round(anonymized.reduce((sum, c) => sum + c.averageScore, 0) / anonymized.length * 10) / 10
        : 0,
      globalPassRate: rows.length
        ? Math.round((rows.filter(r => r.passed).length / rows.length) * 100)
        : 0,
      uniqueTests: new Set(rows.map(r => r.test_title)).size,
      fairness: fairnessMetrics,
    };

    res.json({ overall, candidates: anonymized });
  } catch (error) {
    console.error("Error fetching fairness summary:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
