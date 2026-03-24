import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.get("/init", async (req, res) => {
  res.status(400).json({ 
    error: "manual_creation_required", 
    message: "Cannot execute DDL via REST API. Please execute the chat_messages CREATE TABLE SQL in your Supabase Dashboard SQL Editor." 
  });
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
    if (err.message?.includes("does not exist")) {
      return res.json([]);
    }
    res.status(500).json({ error: "db_error", message: err.message });
  }
});

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
