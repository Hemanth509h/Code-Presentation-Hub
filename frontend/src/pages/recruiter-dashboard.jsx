import { useState, useEffect, useCallback } from "react";
import { useGetCandidateRankings, useGetRecruitmentStats } from "@workspace/api-client-react";
import { AnimatedPage, Card, CardContent, Badge, Button, Input, Label } from "@/components/ui-elements";
import {
  Users, FileText, Target, Trophy, Filter, Plus, Trash2,
  ClipboardList, ChevronDown, ChevronRight, CheckCircle2, XCircle,
  Send, X,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, Cell, PieChart, Pie,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const TYPE_OPTIONS = ["technical", "coding", "aptitude"];
const QUESTION_TYPES = ["multiple_choice", "short_answer", "coding"];
const COLORS = ["#0f766e", "#0ea5e9", "#6366f1", "#8b5cf6", "#a855f7"];

function emptyQuestion() {
  return { text: "", type: "multiple_choice", options: ["", "", "", ""], correctOption: 0, points: 1 };
}

function CreateTestPanel({ onCreated, onCancel }) {
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

function AssignModal({ test, onClose, onAssigned }) {
  const [candidateId, setCandidateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleAssign = async () => {
    if (!candidateId.trim()) { setError("Enter a Candidate ID"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/custom-tests/${test.customTestId}/assign`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidateId.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Assignment failed"); setLoading(false); return; }
      setSuccess(true);
      onAssigned();
    } catch (_) {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Assign Test</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Assign <strong>{test.title}</strong> to a candidate
        </p>

        {success ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-green-600">Assigned successfully!</p>
            <Button className="mt-4 w-full" variant="outline" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <Label>Candidate ID</Label>
              <Input
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                placeholder="e.g. CND-1234"
                onKeyDown={(e) => e.key === "Enter" && handleAssign()}
              />
            </div>
            {error && <p className="text-sm text-destructive mb-3">{error}</p>}
            <Button className="w-full gap-2" isLoading={loading} onClick={handleAssign}>
              <Send className="w-4 h-4" /> Assign Test
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}

function TestCard({ test, onRefresh, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadDetails = async () => {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (!details) {
      const res = await fetch(`/api/custom-tests/${test.customTestId}`, { credentials: "include" });
      if (res.ok) setDetails(await res.json());
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${test.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/custom-tests/${test.customTestId}`, { method: "DELETE", credentials: "include" });
    onDelete();
  };

  const TYPE_COLOR = {
    technical: "bg-orange-100 text-orange-700",
    coding: "bg-blue-100 text-blue-700",
    aptitude: "bg-purple-100 text-purple-700",
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TYPE_COLOR[test.type] || "bg-secondary text-foreground"}`}>
                {test.type}
              </span>
              <span className="text-xs text-muted-foreground">
                {test.questionCount} questions · {test.durationMinutes} min
              </span>
            </div>
            <h4 className="font-semibold text-foreground truncate">{test.title}</h4>
            <p className="text-sm text-muted-foreground mt-0.5">
              {test.assignmentCount} candidate{test.assignmentCount !== 1 ? "s" : ""} assigned
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => setAssigning(true)} className="gap-1.5">
              <Send className="w-3.5 h-3.5" /> Assign
            </Button>
            <button onClick={loadDetails} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {expanded && details && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t px-5 py-4">
                <h5 className="text-sm font-semibold mb-3 text-muted-foreground">Candidates & Results</h5>
                {details.assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No candidates assigned yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground border-b">
                        <th className="text-left pb-2">Candidate ID</th>
                        <th className="text-left pb-2">Status</th>
                        <th className="text-right pb-2">Score</th>
                        <th className="text-right pb-2">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.assignments.map((a) => (
                        <tr key={a.candidateId} className="border-b last:border-0">
                          <td className="py-2 font-mono font-medium">{a.candidateId}</td>
                          <td className="py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              a.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="py-2 text-right font-mono">
                            {a.percentage != null ? `${a.percentage}%` : "—"}
                          </td>
                          <td className="py-2 text-right">
                            {a.passed != null
                              ? a.passed
                                ? <CheckCircle2 className="w-4 h-4 text-green-500 inline" />
                                : <XCircle className="w-4 h-4 text-red-500 inline" />
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      {assigning && (
        <AssignModal
          test={test}
          onClose={() => setAssigning(false)}
          onAssigned={() => { setDetails(null); setAssigning(false); onRefresh(); }}
        />
      )}
    </Card>
  );
}

function CustomTestsTab() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/custom-tests", { credentials: "include" });
      if (res.ok) setTests(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">My Custom Tests</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Create tests and assign them directly to candidates</p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Create Test
          </Button>
        )}
      </div>

      {creating && (
        <CreateTestPanel
          onCreated={() => { setCreating(false); fetchTests(); }}
          onCancel={() => setCreating(false)}
        />
      )}

      {tests.length === 0 && !creating ? (
        <Card className="border-dashed bg-secondary/30">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <ClipboardList className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No custom tests yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Create a custom test with your own questions and assign it to specific candidates.
            </p>
            <Button onClick={() => setCreating(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Create Your First Test
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => (
            <TestCard
              key={test.customTestId}
              test={test}
              onRefresh={fetchTests}
              onDelete={fetchTests}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyticsTab() {
  const [filterType, setFilterType] = useState("all");
  const { data: stats, isLoading: loadingStats } = useGetRecruitmentStats();
  const { data: rankings, isLoading: loadingRankings } = useGetCandidateRankings({ assessmentType: filterType });

  if (loadingStats || loadingRankings) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <Users className="w-6 h-6" />, label: "Total Candidates", value: stats?.totalCandidates || 0, bg: "bg-blue-100 text-blue-600" },
          { icon: <FileText className="w-6 h-6" />, label: "Tests Completed", value: stats?.assessmentsCompleted || 0, bg: "bg-purple-100 text-purple-600" },
          { icon: <Target className="w-6 h-6" />, label: "Avg. Score", value: `${stats?.averageScore || 0}%`, bg: "bg-green-100 text-green-600" },
          { icon: <Trophy className="w-6 h-6" />, label: "Top Performers", value: stats?.topPerformers || 0, bg: "bg-yellow-100 text-yellow-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${s.bg}`}>{s.icon}</div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">{s.label}</p>
                <h4 className="text-2xl font-bold">{s.value}</h4>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-6">Score Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.scoreDistribution || []}>
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {(stats?.scoreDistribution || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-6">Role Distribution</h3>
            <div className="h-64 flex items-center justify-center">
              {stats?.roleDistribution?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.roleDistribution}
                      dataKey="count"
                      nameKey="role"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ role, percent }) => `${role} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.roleDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h3 className="font-semibold text-lg">Candidate Rankings</h3>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {["all", "coding", "aptitude", "technical"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                    filterType === f ? "bg-primary text-white" : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="text-left pb-3 px-3">Rank</th>
                  <th className="text-left pb-3 px-3">Candidate ID</th>
                  <th className="text-left pb-3 px-3">Target Role</th>
                  <th className="text-left pb-3 px-3">Experience</th>
                  <th className="text-right pb-3 px-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {(rankings || []).map((c) => (
                  <tr key={c.candidateId} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        c.rank === 1 ? "bg-yellow-400 text-white"
                        : c.rank === 2 ? "bg-slate-300 text-white"
                        : c.rank === 3 ? "bg-amber-600 text-white"
                        : "bg-secondary text-muted-foreground"
                      }`}>
                        {c.rank}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium">{c.candidateId}</td>
                    <td className="py-3 px-3">{c.targetRole}</td>
                    <td className="py-3 px-3">{c.experienceYears} yrs</td>
                    <td className="py-3 px-3 text-right">
                      <div className="font-bold text-lg">{c.overallScore}%</div>
                      <div className="flex gap-1 justify-end">
                        {c.codingScore != null && <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">C:{c.codingScore}</span>}
                        {c.aptitudeScore != null && <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded">A:{c.aptitudeScore}</span>}
                        {c.technicalScore != null && <span className="text-[10px] bg-orange-100 text-orange-700 px-1 rounded">T:{c.technicalScore}</span>}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!rankings || rankings.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No candidates found for the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RecruiterDashboard() {
  const [activeTab, setActiveTab] = useState("analytics");

  const TABS = [
    { id: "analytics", label: "Analytics", icon: <Trophy className="w-4 h-4" /> },
    { id: "custom-tests", label: "Custom Tests", icon: <ClipboardList className="w-4 h-4" /> },
  ];

  return (
    <AnimatedPage className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
        <p className="text-muted-foreground mt-1">Anonymized, bias-free candidate rankings and insights.</p>
      </div>

      <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-8 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === "analytics" ? <AnalyticsTab /> : <CustomTestsTab />}
        </motion.div>
      </AnimatePresence>
    </AnimatedPage>
  );
}
