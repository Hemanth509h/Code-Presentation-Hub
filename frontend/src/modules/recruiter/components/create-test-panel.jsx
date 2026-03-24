import { useState } from "react";
import { Card, CardContent, Button, Input, Label } from "@/shared/components/ui-elements";
import { Plus, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";

const TYPE_OPTIONS = ["technical", "coding", "aptitude"];
const QUESTION_TYPES = ["multiple_choice", "short_answer", "coding"];

function emptyQuestion() {
  return { text: "", type: "multiple_choice", options: ["", "", "", ""], correctOption: 0, points: 1 };
}

export function CreateTestPanel({ onCreated, onCancel }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("technical");
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateQuestion = (idx, field, value) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  };

  const updateOption = (qIdx, oIdx, value) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: q.options.map((o, j) => (j === oIdx ? value : o)) } : q
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError("Title is required"); return; }
    if (questions.some((q) => !q.text.trim())) { setError("All questions must have text"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/custom-tests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          durationMinutes: Number(duration),
          questions: questions.map((q) => ({
            text: q.text,
            type: q.type,
            options: q.type === "multiple_choice" ? q.options.filter(Boolean) : null,
            correctOption: q.type === "multiple_choice" ? q.correctOption : null,
            points: Number(q.points),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to create test"); setLoading(false); return; }
      onCreated();
    } catch (_) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Create Custom Test</h3>
            <button onClick={onCancel} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Test Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. React Developer Screen" required />
              </div>
              <div>
                <Label>Type</Label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full h-11 rounded-xl border-2 border-input bg-background px-4 text-sm font-medium capitalize focus:outline-none focus:border-primary"
                >
                  {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input type="number" min="5" max="180" value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this test" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Questions ({questions.length})</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setQuestions((p) => [...p, emptyQuestion()])} className="gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Question
                </Button>
              </div>

              <div className="space-y-4">
                {questions.map((q, qi) => (
                  <div key={qi} className="border-2 border-input rounded-xl p-4 bg-secondary/20">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {qi + 1}
                      </span>
                      <div className="flex-1 space-y-3">
                        <div className="flex gap-3">
                          <Input
                            value={q.text}
                            onChange={(e) => updateQuestion(qi, "text", e.target.value)}
                            placeholder="Question text"
                            className="flex-1"
                          />
                          <select
                            value={q.type}
                            onChange={(e) => updateQuestion(qi, "type", e.target.value)}
                            className="h-11 rounded-xl border-2 border-input bg-background px-3 text-sm focus:outline-none focus:border-primary"
                          >
                            {QUESTION_TYPES.map((t) => (
                              <option key={t} value={t}>{t.replace("_", " ")}</option>
                            ))}
                          </select>
                          <Input
                            type="number" min="1" max="10"
                            value={q.points}
                            onChange={(e) => updateQuestion(qi, "points", e.target.value)}
                            className="w-20"
                            placeholder="pts"
                          />
                        </div>

                        {q.type === "multiple_choice" && (
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${qi}`}
                                  checked={q.correctOption === oi}
                                  onChange={() => updateQuestion(qi, "correctOption", oi)}
                                  className="accent-primary"
                                />
                                <Input
                                  value={opt}
                                  onChange={(e) => updateOption(qi, oi, e.target.value)}
                                  placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                  className="flex-1"
                                />
                              </div>
                            ))}
                            <p className="col-span-2 text-xs text-muted-foreground">Select the radio button next to the correct answer</p>
                          </div>
                        )}

                        {(q.type === "short_answer" || q.type === "coding") && (
                          <p className="text-xs text-muted-foreground italic">Candidate will type their answer</p>
                        )}
                      </div>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setQuestions((p) => p.filter((_, i) => i !== qi))}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors mt-0.5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-destructive font-medium">{error}</p>}

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
              <Button type="submit" isLoading={loading}>Create Test</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
