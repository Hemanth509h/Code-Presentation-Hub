import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAuth } from "./auth.js";
import { randomUUID } from "crypto";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  const { title, description, type, durationMinutes, questions } = req.body;
  if (!title || !questions || questions.length === 0) {
    return res.status(400).json({ error: "validation_error", message: "Title and at least one question are required" });
  }

  const testId = `CT-${Date.now().toString(36).toUpperCase()}`;

  try {
    await pool.query(
      `INSERT INTO custom_tests (custom_test_id, title, type, description, duration_minutes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [testId, title, type || "technical", description || "", durationMinutes || 30, req.user.id]
    );

    for (const q of questions) {
      await pool.query(
        `INSERT INTO custom_test_questions (question_id, custom_test_id, question_text, question_type, options, correct_option, points)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [randomUUID(), testId, q.text, q.type || "multiple_choice", q.options || null, q.correctOption ?? null, q.points || 1]
      );
    }

    res.status(201).json({ customTestId: testId, title });
  } catch (err) {
    res.status(500).json({ error: "db_error", message: err.message });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ct.custom_test_id, ct.title, ct.type, ct.description, ct.duration_minutes, ct.created_at,
              COUNT(DISTINCT ctq.id) AS question_count,
              COUNT(DISTINCT cta.id) AS assignment_count
       FROM custom_tests ct
       LEFT JOIN custom_test_questions ctq ON ct.custom_test_id = ctq.custom_test_id
       LEFT JOIN custom_test_assignments cta ON ct.custom_test_id = cta.custom_test_id
       WHERE ct.created_by = $1
       GROUP BY ct.custom_test_id, ct.title, ct.type, ct.description, ct.duration_minutes, ct.created_at
       ORDER BY ct.created_at DESC`,
      [req.user.id]
    );
    res.json(rows.map((t) => ({
      customTestId: t.custom_test_id,
      title: t.title,
      type: t.type,
      description: t.description,
      durationMinutes: t.duration_minutes,
      createdAt: t.created_at,
      questionCount: parseInt(t.question_count),
      assignmentCount: parseInt(t.assignment_count),
    })));
  } catch (err) {
    res.status(500).json({ error: "db_error", message: err.message });
  }
});

router.get("/:testId", requireAuth, async (req, res) => {
  const { testId } = req.params;
  try {
    const { rows: [test] } = await pool.query(
      `SELECT * FROM custom_tests WHERE custom_test_id = $1 AND created_by = $2`,
      [testId, req.user.id]
    );
    if (!test) return res.status(404).json({ error: "not_found", message: "Test not found" });

    const { rows: questions } = await pool.query(
      `SELECT * FROM custom_test_questions WHERE custom_test_id = $1 ORDER BY id`,
      [testId]
    );

    const { rows: assignments } = await pool.query(
      `SELECT cta.candidate_id, cta.assigned_at, cta.status,
              cts.score, cts.max_score, cts.percentage, cts.passed, cts.completed_at AS submitted_at
       FROM custom_test_assignments cta
       LEFT JOIN custom_test_submissions cts
         ON cta.custom_test_id = cts.custom_test_id AND cta.candidate_id = cts.candidate_id
       WHERE cta.custom_test_id = $1
       ORDER BY cta.assigned_at DESC`,
      [testId]
    );

    res.json({
      customTestId: test.custom_test_id,
      title: test.title,
      type: test.type,
      description: test.description,
      durationMinutes: test.duration_minutes,
      createdAt: test.created_at,
      questions: questions.map((q) => ({
        questionId: q.question_id,
        text: q.question_text,
        type: q.question_type,
        options: q.options,
        correctOption: q.correct_option,
        points: q.points,
      })),
      assignments: assignments.map((a) => ({
        candidateId: a.candidate_id,
        assignedAt: a.assigned_at,
        status: a.status,
        score: a.score,
        maxScore: a.max_score,
        percentage: a.percentage,
        passed: a.passed,
        submittedAt: a.submitted_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "db_error", message: err.message });
  }
});

router.post("/:testId/assign", requireAuth, async (req, res) => {
  const { testId } = req.params;
  const { candidateId } = req.body;
  if (!candidateId) {
    return res.status(400).json({ error: "missing_fields", message: "candidateId is required" });
  }

  try {
    const { rows: [test] } = await pool.query(
      `SELECT * FROM custom_tests WHERE custom_test_id = $1 AND created_by = $2`,
      [testId, req.user.id]
    );
    if (!test) return res.status(404).json({ error: "not_found", message: "Test not found" });

    const { rows: [candidate] } = await pool.query(
      `SELECT candidate_id FROM candidates WHERE candidate_id = $1`,
      [candidateId]
    );
    if (!candidate) return res.status(404).json({ error: "not_found", message: "Candidate not found" });

    await pool.query(
      `INSERT INTO custom_test_assignments (custom_test_id, candidate_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [testId, candidateId]
    );

    res.json({ success: true, candidateId });
  } catch (err) {
    res.status(500).json({ error: "db_error", message: err.message });
  }
});

router.delete("/:testId", requireAuth, async (req, res) => {
  const { testId } = req.params;
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM custom_tests WHERE custom_test_id = $1 AND created_by = $2`,
      [testId, req.user.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: "not_found", message: "Test not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "db_error", message: err.message });
  }
});

router.get("/:testId/take", async (req, res) => {
  const { testId } = req.params;
  try {
    const { rows: [test] } = await pool.query(
      `SELECT * FROM custom_tests WHERE custom_test_id = $1`,
      [testId]
    );
    if (!test) return res.status(404).json({ error: "not_found", message: "Test not found" });

    const { rows: questions } = await pool.query(
      `SELECT question_id, question_text, question_type, options, points FROM custom_test_questions WHERE custom_test_id = $1 ORDER BY id`,
      [testId]
    );

    res.json({
      customTestId: test.custom_test_id,
      title: test.title,
      type: test.type,
      description: test.description,
      durationMinutes: test.duration_minutes,
      questions: questions.map((q) => ({
        questionId: q.question_id,
        text: q.question_text,
        type: q.question_type,
        options: q.options,
        points: q.points,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "db_error", message: err.message });
  }
});

router.post("/:testId/submit", async (req, res) => {
  const { testId } = req.params;
  const { candidateId, answers } = req.body;

  if (!candidateId || !answers) {
    return res.status(400).json({ error: "missing_fields", message: "candidateId and answers are required" });
  }

  try {
    const { rows: [assignment] } = await pool.query(
      `SELECT * FROM custom_test_assignments WHERE custom_test_id = $1 AND candidate_id = $2`,
      [testId, candidateId]
    );
    if (!assignment) {
      return res.status(403).json({ error: "not_assigned", message: "You are not assigned to this test" });
    }

    const { rows: questions } = await pool.query(
      `SELECT * FROM custom_test_questions WHERE custom_test_id = $1`,
      [testId]
    );

    let score = 0;
    let maxScore = 0;
    for (const q of questions) {
      maxScore += q.points;
      const ans = answers.find((a) => a.questionId === q.question_id);
      if (ans) {
        if (q.question_type === "multiple_choice" && ans.selectedOption != null) {
          if (ans.selectedOption === q.correct_option) score += q.points;
        } else if ((q.question_type === "coding" || q.question_type === "short_answer") && ans.textAnswer?.trim().length > 10) {
          score += q.points * 0.7;
        }
      }
    }

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : 0;
    const passed = percentage >= 60;

    await pool.query(
      `INSERT INTO custom_test_submissions (custom_test_id, candidate_id, score, max_score, percentage, passed)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (custom_test_id, candidate_id)
       DO UPDATE SET score = $3, max_score = $4, percentage = $5, passed = $6, completed_at = NOW()`,
      [testId, candidateId, score, maxScore, percentage, passed]
    );

    await pool.query(
      `UPDATE custom_test_assignments SET status = 'completed' WHERE custom_test_id = $1 AND candidate_id = $2`,
      [testId, candidateId]
    );

    let feedback = "";
    if (percentage >= 90) feedback = "Outstanding! You demonstrated exceptional mastery.";
    else if (percentage >= 75) feedback = "Great job! You showed strong understanding.";
    else if (percentage >= 60) feedback = "Good work! You passed with a solid score.";
    else feedback = "Keep practicing! Review the topics and try again.";

    res.json({ candidateId, customTestId: testId, score, maxScore, percentage, passed, feedback });
  } catch (err) {
    res.status(500).json({ error: "db_error", message: err.message });
  }
});

export default router;
