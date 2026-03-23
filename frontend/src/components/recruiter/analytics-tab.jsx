import { useState } from "react";
import { useGetCandidateRankings, useGetRecruitmentStats } from "@/lib/api";
import { Card, CardContent } from "@/components/ui-elements";
import { Users, FileText, Target, Trophy, Filter } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, Cell, PieChart, Pie,
} from "recharts";

const COLORS = ["#0f766e", "#0ea5e9", "#6366f1", "#8b5cf6", "#a855f7"];

export function AnalyticsTab() {
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
