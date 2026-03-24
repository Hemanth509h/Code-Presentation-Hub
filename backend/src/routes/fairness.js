import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.get("/results", async (req, res) => {
  try {
    const { data: submissions, error: sError } = await supabase
      .from("custom_test_submissions")
      .select("*, custom_tests(title)")
      .order("completed_at", { ascending: false });

    if (sError) throw sError;

    const rows = submissions.map(s => ({
      custom_test_id: s.custom_test_id,
      test_title: s.custom_tests?.title || "Unknown Test",
      candidate_id: s.candidate_id,
      score: s.score,
      max_score: s.max_score,
      percentage: s.percentage,
      passed: s.passed,
      completed_at: s.completed_at,
    }));


    const candidateMap = new Map();
    let currentCandidateIndex = 1;

    const anonymizedResults = rows.map((row) => {
      if (!candidateMap.has(row.candidate_id)) {
        candidateMap.set(row.candidate_id, `Candidate ${currentCandidateIndex++}`);
      }
      return {
        ...row,
        candidate_id: candidateMap.get(row.candidate_id),
      };
    });

    res.json(anonymizedResults);
  } catch (error) {
    console.error("Error fetching fairness results:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
