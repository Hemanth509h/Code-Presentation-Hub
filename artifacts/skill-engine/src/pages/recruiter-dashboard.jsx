import { useState } from "react";
import {
  useGetCandidateRankings,
  useGetRecruitmentStats,
} from "@workspace/api-client-react";
import {
  AnimatedPage,
  Card,
  CardContent,
  Badge,
} from "@/components/ui-elements";
import { Users, FileText, Target, Trophy, Filter } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";

export default function RecruiterDashboard() {
  const [filterType, setFilterType] = useState("all");

  const { data: stats, isLoading: loadingStats } = useGetRecruitmentStats();
  const { data: rankings, isLoading: loadingRankings } =
    useGetCandidateRankings({ assessmentType: filterType });

  if (loadingStats || loadingRankings) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const COLORS = ["#0f766e", "#0ea5e9", "#6366f1", "#8b5cf6", "#a855f7"];

  return (
    <AnimatedPage className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Anonymized, bias-free candidate rankings and insights.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                Total Candidates
              </p>
              <h4 className="text-2xl font-bold">
                {stats?.totalCandidates || 0}
              </h4>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                Tests Completed
              </p>
              <h4 className="text-2xl font-bold">
                {stats?.assessmentsCompleted || 0}
              </h4>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                Avg. Score
              </p>
              <h4 className="text-2xl font-bold">
                {stats?.averageScore || 0}%
              </h4>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                Top Performers
              </p>
              <h4 className="text-2xl font-bold">
                {stats?.topPerformers || 0}
              </h4>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-6">Score Distribution</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.scoreDistribution || []}>
                  <XAxis dataKey="range" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(stats?.scoreDistribution || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-6">Target Roles</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.roleDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="role"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {(stats?.roleDistribution || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rankings Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-bold">Candidate Leaderboard</h3>
          <div className="flex items-center gap-2 bg-secondary p-1 rounded-xl">
            <Filter className="w-4 h-4 ml-2 text-muted-foreground" />
            <select
              className="bg-transparent border-none focus:ring-0 text-sm font-medium pr-8"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Assessments</option>
              <option value="coding">Coding Only</option>
              <option value="aptitude">Aptitude Only</option>
              <option value="technical">Technical Only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-secondary/50 text-muted-foreground uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Rank</th>
                <th className="px-6 py-4 font-semibold">Candidate ID</th>
                <th className="px-6 py-4 font-semibold">Role & Experience</th>
                <th className="px-6 py-4 font-semibold">Skills</th>
                <th className="px-6 py-4 font-semibold text-right">Scores</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rankings?.map((candidate) => (
                <tr
                  key={candidate.candidateId}
                  className="hover:bg-secondary/20 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold
                      ${
                        candidate.rank === 1
                          ? "bg-yellow-100 text-yellow-700"
                          : candidate.rank === 2
                          ? "bg-slate-200 text-slate-700"
                          : candidate.rank === 3
                          ? "bg-orange-100 text-orange-800"
                          : "bg-background text-muted-foreground"
                      }`}
                    >
                      #{candidate.rank}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-primary">
                    {candidate.candidateId}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-foreground">
                      {candidate.targetRole}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {candidate.experienceYears} Years Exp.
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap max-w-[250px]">
                      {candidate.skills.slice(0, 3).map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {candidate.skills.length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          +{candidate.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <div className="font-bold text-lg text-foreground">
                        {candidate.overallScore}%
                      </div>
                      <div className="flex gap-1">
                        {candidate.codingScore != null && (
                          <span
                            className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded"
                            title="Coding"
                          >
                            C:{candidate.codingScore}
                          </span>
                        )}
                        {candidate.aptitudeScore != null && (
                          <span
                            className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded"
                            title="Aptitude"
                          >
                            A:{candidate.aptitudeScore}
                          </span>
                        )}
                        {candidate.technicalScore != null && (
                          <span
                            className="text-[10px] bg-orange-100 text-orange-700 px-1 rounded"
                            title="Technical"
                          >
                            T:{candidate.technicalScore}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {(!rankings || rankings.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    No candidates found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AnimatedPage>
  );
}
