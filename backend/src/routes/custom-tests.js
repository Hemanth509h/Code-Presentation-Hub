import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { db, sync, initStorage } from "../utils/storage.js";
import { requireAuth } from "../middleware/auth.js";
import { randomUUID } from "crypto";

// Initialize storage on load
initStorage();

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  const { title, description, type, durationMinutes, questions } = req.body;
  if (!title || !questions || questions.length === 0) {
    return res.status(400).json({ error: "validation_error", message: "Title and at least one question are required" });
  }

  const testId = `CT-${Date.now().toString(36).toUpperCase()}`;

  try {
    const { error: testError } = await supabase.from("custom_tests").insert({
      custom_test_id: testId,
      title,
      type: type || "technical",
      description: description || "",
      duration_minutes: durationMinutes || 30,
      created_by: req.user.id
    });
    if (testError) throw testError;

    const questionsToInsert = questions.map((q) => ({
      question_id: randomUUID(),
      custom_test_id: testId,
      question_text: q.text,
      question_type: q.type || "multiple_choice",
      options: q.options || null,
      correct_option: q.correctOption ?? null,
      points: q.points || 1
    }));

    const { error: qError } = await supabase.from("custom_test_questions").insert(questionsToInsert);
    if (qError) throw qError;

    res.status(201).json({ customTestId: testId, title });
  } catch (err) {
    res.status(500).json({ error: "db_error", message: err.message });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    // Supabase standard queries can select related count natively
    const { data: customTests, error } = await supabase
      .from("custom_tests")
      .select("*, custom_test_questions(count), custom_test_assignments(count)")
      .eq("created_by", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formatted = customTests.map((t) => ({
      customTestId: t.custom_test_id,
      title: t.title,
      type: t.type,
      description: t.description,
      durationMinutes: t.duration_minutes,
      createdAt: t.created_at,
      questionCount: t.custom_test_questions?.[0]?.count ?? 0,
      assignmentCount: t.custom_test_assignments?.[0]?.count ?? 0,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "db_error", message: err.message });
  }
});

router.get("/:testId", requireAuth, async (req, res) => {
  const { testId } = req.params;
  try {
    const { data: test, error: tError } = await supabase
      .from("custom_tests")
      .select("*")
      .eq("custom_test_id", testId)
      .eq("created_by", req.user.id)
      .single();
    if (tError) throw tError;
    if (!test) return res.status(404).json({ error: "not_found", message: "Test not found" });

    const { data: questions, error: qError } = await supabase
      .from("custom_test_questions")
      .select("*")
      .eq("custom_test_id", testId)
      .order("id");
    if (qError) throw qError;

    // Fetch assignments and their submissions manually to avoid PostgREST relationship issues on composite keys
    const { data: assignments, error: aError } = await supabase
      .from("custom_test_assignments")
      .select("*")
      .eq("custom_test_id", testId)
      .order("assigned_at", { ascending: false });
    if (aError) throw aError;

    const { data: submissions, error: sError } = await supabase
      .from("custom_test_submissions")
      .select("*")
      .eq("custom_test_id", testId);
    if (sError) throw sError;

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
      assignments: assignments.map((a) => {
        const sub = submissions.find(s => s.candidate_id === a.candidate_id);
        return {
          candidateId: a.candidate_id,
          assignedAt: a.assigned_at,
          status: a.status,
          score: sub?.score ?? null,
          maxScore: sub?.max_score ?? null,
          percentage: sub?.percentage ?? null,
          passed: sub?.passed ?? null,
          submittedAt: sub?.completed_at ?? null,
        };
      }),
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
    const { data: test, error: tError } = await supabase
      .from("custom_tests")
      .select("custom_test_id")
      .eq("custom_test_id", testId)
      .eq("created_by", req.user.id)
      .single();
    if (tError || !test) return res.status(404).json({ error: "not_found", message: "Test not found" });

    const { data: candidate, error: cError } = await supabase
      .from("candidates")
      .select("candidate_id")
      .eq("candidate_id", candidateId)
      .single();
    if (cError || !candidate) return res.status(404).json({ error: "not_found", message: "Candidate not found" });

    // UPSERT or Ignore if existing assignment
    const { error: aError } = await supabase
      .from("custom_test_assignments")
      .upsert({ custom_test_id: testId, candidate_id: candidateId }, { onConflict: "custom_test_id, candidate_id", ignoreDuplicates: true });
    if (aError) throw aError;

    res.json({ success: true, candidateId });
  } catch (err) {
    res.status(500).json({ error: "db_error", message: err.message });
  }
});

router.delete("/:testId", requireAuth, async (req, res) => {
  const { testId } = req.params;
  try {
    const { data, error } = await supabase
      .from("custom_tests")
      .delete()
      .eq("custom_test_id", testId)
      .eq("created_by", req.user.id)
      .select();
    
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: "not_found", message: "Test not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "db_error", message: err.message });
  }
});

router.get("/:testId/take", async (req, res) => {
  const { testId } = req.params;
  try {
    const { data: test, error: tError } = await supabase
      .from("custom_tests")
      .select("*")
      .eq("custom_test_id", testId)
      .single();
    if (tError || !test) return res.status(404).json({ error: "not_found", message: "Test not found" });

    const { data: questions, error: qError } = await supabase
      .from("custom_test_questions")
      .select("question_id, question_text, question_type, options, points")
      .eq("custom_test_id", testId)
      .order("id");
    if (qError) throw qError;

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
    const { data: assignment, error: aError } = await supabase
      .from("custom_test_assignments")
      .select("*")
      .eq("custom_test_id", testId)
      .eq("candidate_id", candidateId)
      .single();
    if (aError || !assignment) {
      return res.status(403).json({ error: "not_assigned", message: "You are not assigned to this test" });
    }

    const { data: questions, error: qError } = await supabase
      .from("custom_test_questions")
      .select("*")
      .eq("custom_test_id", testId);
    if (qError) throw qError;

    let score = 0;
    let maxScore = 0;
    for (const q of questions) {
      maxScore += q.points;
      const ans = answers.find((a) => a.questionId === q.question_id);
      if (ans) {
        if (q.question_type === "multiple_choice" && ans.selectedOption != null) {
          if (ans.selectedOption === q.correct_option) score += q.points;
        } else if ((q.question_type === "coding" || q.question_type === "short_answer") && ans.textAnswer?.trim().length > 10) {
          score += q.points * 0.7; // Simple evaluation
        }
      }
    }

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : 0;
    const passed = percentage >= 60;

    const { error: upsertError } = await supabase
      .from("custom_test_submissions")
      .upsert({
        custom_test_id: testId,
        candidate_id: candidateId,
        score,
        max_score: maxScore,
        percentage,
        passed,
        completed_at: new Date().toISOString()
      }, { onConflict: "custom_test_id, candidate_id" });
    if (upsertError) throw upsertError;

    const { error: updateError } = await supabase
      .from("custom_test_assignments")
      .update({ status: 'completed' })
      .eq("custom_test_id", testId)
      .eq("candidate_id", candidateId);
    if (updateError) throw updateError;

    // 2. Automate Shortlist addition for the recruiter who created this test
    try {
      const { data: testInfo } = await supabase
        .from("custom_tests")
        .select("created_by")
        .eq("custom_test_id", testId)
        .single();
      
      if (testInfo && testInfo.created_by) {
        const recruiterId = testInfo.created_by;
        if (!db.shortlists[recruiterId]) db.shortlists[recruiterId] = [];
        if (!db.shortlists[recruiterId].includes(candidateId)) {
          db.shortlists[recruiterId].push(candidateId);
          sync();
          console.log(`[AutoShortlist] Added candidate ${candidateId} to recruiter ${recruiterId} shortlist after test completion.`);
        }
      }
    } catch (err) {
      console.error("[AutoShortlist] Failed to update shortlist:", err);
    }

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
