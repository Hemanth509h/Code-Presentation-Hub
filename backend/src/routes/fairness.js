import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

router.get("/results", async (req, res) => {
  try {
    const query = `
      SELECT 
        s.custom_test_id,
        t.title as test_title,
        s.candidate_id,
        s.score,
        s.max_score,
        s.percentage,
        s.passed,
        s.completed_at
      FROM custom_test_submissions s
      JOIN custom_tests t ON s.custom_test_id = t.custom_test_id
      ORDER BY s.completed_at DESC
    `;
    const { rows } = await pool.query(query);

    // Anonymize candidate IDs
    const candidateMap = new Map();
    let currentCandidateIndex = 1;

    const anonymizedResults = rows.map((row) => {
      if (!candidateMap.has(row.candidate_id)) {
        candidateMap.set(row.candidate_id, `Candidate ${currentCandidateIndex++}`);
      }
      
      return {
        ...row,
        candidate_id: candidateMap.get(row.candidate_id) // Overwrite with anonymized ID
      };
    });

    res.json(anonymizedResults);
  } catch (error) {
    console.error("Error fetching fairness results:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
