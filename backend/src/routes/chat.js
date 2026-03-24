import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

// Fetch conversation history for a specific room (test-candidate pair)
router.get("/init", async (req, res) => {
  try {
    const { pool } = await import("@workspace/db");
    const initSql = `
      CREATE TABLE IF NOT EXISTS chat_messages (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        custom_test_id text NOT NULL,
        candidate_id text NOT NULL,
        sender_role text NOT NULL,
        sender_id text NOT NULL,
        message text NOT NULL,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );
      ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Service Role Full Access on Chat" ON chat_messages;
      CREATE POLICY "Service Role Full Access on Chat" ON chat_messages
        FOR ALL TO service_role USING (true) WITH CHECK (true);
    `;
    await pool.query(initSql);
    res.json({ success: true, message: "Chat table initialized via API." });
  } catch (err) {
    res.status(500).json({ error: "db_init_error", message: err.message });
  }
});

router.get("/:customTestId/:candidateId", async (req, res) => {
  const { customTestId, candidateId } = req.params;

  try {
    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("custom_test_id", customTestId)
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json(messages || []);
  } catch (err) {
    // Graceful fallback if table doesn't exist yet, instead of throwing 500 continuously on polling
    if (err.message?.includes("does not exist")) {
      return res.json([]); 
    }
    res.status(500).json({ error: "db_error", message: err.message });
  }
});

// Dispatch a new message
router.post("/", async (req, res) => {
  const { customTestId, candidateId, senderRole, senderId, message } = req.body;

  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        custom_test_id: customTestId,
        candidate_id: candidateId,
        sender_role: senderRole,
        sender_id: senderId,
        message: message,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: "db_error", message: err.message });
  }
});

export default router;
