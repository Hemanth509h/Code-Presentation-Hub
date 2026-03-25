import { useState, useMemo, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/shared/ui/chart";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  Trophy, Users, CheckCircle, Percent, Activity,
  ChevronDown, ChevronUp, Search, RefreshCw,
  Shield, AlertCircle, ArrowUp, ArrowDown, ArrowUpDown,
  ClipboardList, BookOpen, Fingerprint, Lock, Eye,
} from "lucide-react";

// ─── helpers ───────────────────────────────────────────────────────
const scoreColor = (pct) => {
  if (pct >= 80) return "text-emerald-600";
  if (pct >= 60) return "text-yellow-600";
  return "text-red-500";
};
const scoreBg = (pct) => {
  if (pct >= 80) return "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (pct >= 60) return "bg-yellow-50 border-yellow-200 text-yellow-700";
  return "bg-red-50 border-red-200 text-red-700";
};

// ─── KPI Card ──────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Sort icon helper ──────────────────────────────────────────────
function SortIcon({ field, sortKey, dir }) {
  if (sortKey !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-30 ml-1 inline" />;
  return dir === "asc"
    ? <ArrowUp className="w-3.5 h-3.5 ml-1 inline text-primary" />
    : <ArrowDown className="w-3.5 h-3.5 ml-1 inline text-primary" />;
}

// ─── Score bar ─────────────────────────────────────────────────────
function ScoreBar({ value }) {
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-semibold tabular-nums w-10 text-right ${scoreColor(value)}`}>
        {value}%
      </span>
    </div>
  );
}

// ─── Expandable Row Detail ─────────────────────────────────────────
function CandidateDetail({ candidate }) {
  const radarData = candidate.tests.slice(0, 6).map(t => ({
    subject: t.test_title.length > 14 ? t.test_title.slice(0, 14) + "…" : t.test_title,
    score: Math.round(t.percentage),
  }));

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <td colSpan={7} className="px-0 pb-0">
        <div className="mx-4 mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
          <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Test Breakdown — {candidate.candidate_id}
          </h4>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Tests table */}
            <div className="overflow-x-auto rounded-lg border border-border bg-background">
              <table className="w-full text-xs">
                <thead className="bg-secondary/60 text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Test</th>
                    <th className="px-3 py-2 text-right font-semibold">Score</th>
                    <th className="px-3 py-2 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {candidate.tests.map((t, i) => (
                    <tr key={i} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-3 py-2 max-w-[160px] truncate">{t.test_title}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={`font-semibold ${scoreColor(t.percentage)}`}>{Math.round(t.percentage)}%</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${t.passed ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"}`}>
                          {t.passed ? "Passed" : "Failed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mini radar chart */}
            {radarData.length >= 3 ? (
              <div className="flex flex-col items-center justify-center">
                <p className="text-xs font-medium text-muted-foreground mb-1">Skill Radar</p>
                <ChartContainer
                  config={{ score: { label: "Score (%)", color: "hsl(var(--chart-1))" } }}
                  className="h-[200px] w-full"
                >
                  <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar name="Score" dataKey="score" stroke="var(--color-score)" fill="var(--color-score)" fillOpacity={0.4} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RadarChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-xl">
                Need ≥ 3 tests for radar chart
              </div>
            )}
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────
export default function AnonymizedResultsDashboard() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("rank");
  const [sortDir, setSortDir] = useState("asc");
  const [expandedId, setExpandedId] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["fairnessSummary"],
    queryFn: async () => {
      const res = await fetch("/api/fairness/summary");
      if (!res.ok) throw new Error("Failed to fetch anonymized results");
      return res.json();
    },
  });

  const overall = data?.overall;
  const fairness = overall?.fairness;
  const rawCandidates = data?.candidates || [];

  // Distribution data
  const distributionData = useMemo(() => {
    const bins = { "0–20": 0, "21–40": 0, "41–60": 0, "61–80": 0, "81–100": 0 };
    rawCandidates.forEach(c => {
      const p = c.averageScore;
      if (p <= 20) bins["0–20"]++;
      else if (p <= 40) bins["21–40"]++;
      else if (p <= 60) bins["41–60"]++;
      else if (p <= 80) bins["61–80"]++;
      else bins["81–100"]++;
    });
    return Object.entries(bins).map(([range, count]) => ({ range, count }));
  }, [rawCandidates]);

  const passFailData = useMemo(() => {
    if (!overall) return [];
    const passed = Math.round((overall.globalPassRate / 100) * overall.totalEvaluations);
    const failed = overall.totalEvaluations - passed;
    return [
      { name: "Passed", value: passed, fill: "var(--color-Passed)" },
      { name: "Failed", value: failed, fill: "var(--color-Failed)" },
    ];
  }, [overall]);

  const candidates = useMemo(() => {
    let result = rawCandidates.filter(c => {
      const matchSearch = c.candidate_id.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" ? true :
          statusFilter === "pass" ? c.passRate >= 60 :
            c.passRate < 60;
      return matchSearch && matchStatus;
    });

    result.sort((a, b) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      const dir = sortDir === "asc" ? 1 : -1;
      if (typeof aVal === "string") return dir * aVal.localeCompare(bVal);
      return dir * (aVal - bVal);
    });

    return result;
  }, [rawCandidates, search, statusFilter, sortKey, sortDir]);

  const toggleSort = (field) => {
    if (sortKey === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(field); setSortDir("asc"); }
  };

  const thCls = (field) =>
    `px-4 py-3 font-semibold cursor-pointer select-none hover:text-foreground transition-colors ${sortKey === field ? "text-primary" : "text-muted-foreground"}`;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
        <div className="h-9 w-72 bg-secondary animate-pulse rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-secondary animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-secondary animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Failed to load data</p>
            <p className="text-sm mt-0.5">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Fairness & Rankings Hub</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Automated bias monitoring and talent discovery through anonymized skill assessment.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors text-sm font-medium shrink-0"
        >
          <RefreshCw className="w-4 h-4" /> Sync Data
        </button>
      </div>

      {/* ─── Fairness Section ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Fairness Monitoring</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <KpiCard
            icon={Shield}
            label="Bias Detection Score"
            value={fairness ? `${fairness.biasScore}/100` : "Calculating…"}
            sub="Composite neutrality index"
            color="bg-emerald-100 text-emerald-700"
          />
          <KpiCard
            icon={Activity}
            label="Selection Parity (AIR)"
            value={fairness ? fairness.impactRatio : "0.00"}
            sub="Adverse Impact Ratio (>0.8+)"
            color="bg-blue-100 text-blue-700"
          />

          <KpiCard
            icon={Percent}
            label="Score Variance"
            value={fairness ? `±${fairness.scoreStdDev}` : "0.0"}
            sub="Std deviation of performance"
            color="bg-orange-100 text-orange-700"
          />
          <KpiCard
            icon={BookOpen}
            label="Exp-Score Neutrality"
            value={fairness ? `${fairness.neutralityIndex}%` : "—"}
            sub="Lower correlation = Higher fairness"
            color="bg-violet-100 text-violet-700"
          />
        </div>
      </div>

      {/* ─── Transparency & Methodology ─── */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* Bias Reduction Methodology */}
        <div className="md:col-span-2 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-accent/5 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Bias Reduction Approach</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Eye, title: "Identity Masking", desc: "Names, emails and demographics are redacted until mutual interest." },
              { icon: Activity, title: "Objective Scoring", desc: "Performance is measured against standardized skill benchmarks." },
              { icon: Trophy, title: "Merit-only Ranking", desc: "Sorting is purely based on verified assessment scores." },
              { icon: Shield, title: "Mutual Reveal", desc: "Contact details are only shared after a candidate's consent." },
            ].map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center shadow-sm">
                  <step.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">{step.title}</h4>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── General Stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border flex flex-col justify-center">
          <p className="text-xs text-muted-foreground font-medium uppercase">Participants</p>
          <p className="text-2xl font-bold">{overall?.totalCandidates || 0}</p>
        </div>
        <div className="p-4 rounded-xl border border-border flex flex-col justify-center">
          <p className="text-xs text-muted-foreground font-medium uppercase">Evaluations</p>
          <p className="text-2xl font-bold">{overall?.totalEvaluations || 0}</p>
        </div>
        <div className="p-4 rounded-xl border border-border flex flex-col justify-center">
          <p className="text-xs text-muted-foreground font-medium uppercase">Global Average</p>
          <p className="text-2xl font-bold">{overall?.globalAvgScore || 0}%</p>
        </div>
        <div className="p-4 rounded-xl border border-border flex flex-col justify-center">
          <p className="text-xs text-muted-foreground font-medium uppercase">Global Pass Rate</p>
          <p className="text-2xl font-bold text-emerald-600">{overall?.globalPassRate || 0}%</p>
        </div>
      </div>

      {/* ─── Charts ─── */}
      {rawCandidates.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-semibold mb-1">Distribution Consistency</h3>
            <p className="text-xs text-muted-foreground mb-4">Verifying skill scores follow a natural distribution</p>
            <ChartContainer
              config={{ count: { label: "Candidates", color: "hsl(var(--chart-1))" } }}
              className="h-[220px] w-full"
            >
              <BarChart data={distributionData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-semibold mb-1">Impact Ratio Monitoring</h3>
            <p className="text-xs text-muted-foreground mb-4">Pass/Fail ratio across anonymized cohort clusters</p>
            <ChartContainer
              config={{
                Passed: { label: "Passed", color: "hsl(var(--chart-2))" },
                Failed: { label: "Failed", color: "hsl(var(--destructive))" },
              }}
              className="h-[220px] w-full"
            >
              <PieChart>
                <Pie data={passFailData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90}>
                  {passFailData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </div>
        </div>
      )}

      {/* ─── Filter bar ─── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search anonymized ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-60"
          />
        </div>
        <div className="flex gap-2">
          {[["all", "All"], ["pass", "Passing"], ["fail", "Failing"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors border ${statusFilter === val ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-secondary text-muted-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-secondary/50 border-b border-border text-xs uppercase tracking-wider">
              <tr>
                <th className={thCls("rank")} onClick={() => toggleSort("rank")}>
                  # <SortIcon field="rank" sortKey={sortKey} dir={sortDir} />
                </th>
                <th className={thCls("candidate_id")} onClick={() => toggleSort("candidate_id")}>
                  Candidate <SortIcon field="candidate_id" sortKey={sortKey} dir={sortDir} />
                </th>
                <th className={thCls("totalTests")} onClick={() => toggleSort("totalTests")}>
                  Tests <SortIcon field="totalTests" sortKey={sortKey} dir={sortDir} />
                </th>
                <th className={thCls("averageScore")} onClick={() => toggleSort("averageScore")}>
                  Avg Score <SortIcon field="averageScore" sortKey={sortKey} dir={sortDir} />
                </th>
                <th className={thCls("passRate")} onClick={() => toggleSort("passRate")}>
                  Status <SortIcon field="passRate" sortKey={sortKey} dir={sortDir} />
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-center">Detail Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {candidates.map((c) => (
                <Fragment key={c.candidate_id}>
                  <tr className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      {c.rank <= 3 ? (
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs ${c.rank === 1 ? "bg-yellow-100 text-yellow-700" : c.rank === 2 ? "bg-slate-100 text-slate-600" : "bg-orange-100 text-orange-700"}`}>
                          {c.rank === 1 ? "🥇" : c.rank === 2 ? "🥈" : "🥉"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-mono">{c.rank}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <span className="font-semibold text-primary">{c.candidate_id}</span>
                      {c.averageScore >= 85 && <Trophy className="w-3.5 h-3.5 text-yellow-500" title="Top Performer" />}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <ClipboardList className="w-3.5 h-3.5" />
                        {c.totalTests}
                      </span>
                    </td>
                    <td className="px-4 py-3 min-w-[160px]">
                      <ScoreBar value={c.averageScore} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${scoreBg(c.passRate)}`}>
                        {c.passRate}% Pass
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setExpandedId(expandedId === c.candidate_id ? null : c.candidate_id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-secondary transition-colors text-xs font-medium"
                      >
                        {expandedId === c.candidate_id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {expandedId === c.candidate_id ? "Close" : "Review"}
                      </button>
                    </td>
                  </tr>
                  <AnimatePresence>
                    {expandedId === c.candidate_id && (
                      <CandidateDetail candidate={c} />
                    )}
                  </AnimatePresence>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border bg-secondary/30 text-xs text-muted-foreground flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          Bias-protected talent discovery. Identities are revealed only after mutual interest confirmation.
        </div>
      </div>
    </div>
  );
}
