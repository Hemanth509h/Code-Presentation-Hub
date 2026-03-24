import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { AlertCircle, Users, CheckCircle, Percent, Activity } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/shared/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";

export default function FairnessDashboard() {
  const { data: results, isLoading, error } = useQuery({
    queryKey: ["fairnessResults"],
    queryFn: async () => {
      const res = await fetch("/api/fairness/results");
      if (!res.ok) throw new Error("Failed to fetch fairness results");
      return res.json();
    },
  });

  const { stats, distributionData, passFailData } = useMemo(() => {
    if (!results || results.length === 0) {
      return { stats: null, distributionData: [], passFailData: [] };
    }

    const uniqueCandidates = new Set(results.map(r => r.candidate_id)).size;
    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.length - passedCount;
    const avgScore = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;

    const stats = {
      totalCandidates: uniqueCandidates,
      totalEvaluations: results.length,
      passRate: (passedCount / results.length) * 100,
      averageScore: avgScore,
    };

    const bins = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
    results.forEach(r => {
      const p = r.percentage;
      if (p <= 20) bins["0-20"]++;
      else if (p <= 40) bins["21-40"]++;
      else if (p <= 60) bins["41-60"]++;
      else if (p <= 80) bins["61-80"]++;
      else bins["81-100"]++;
    });

    const distributionData = Object.entries(bins).map(([range, count]) => ({
      range,
      count
    }));

    const passFailData = [
      { name: "Passed", value: passedCount, fill: "var(--color-Passed)" },
      { name: "Failed", value: failedCount, fill: "var(--color-Failed)" },
    ];

    return { stats, distributionData, passFailData };
  }, [results]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-8 max-w-6xl">
        <Skeleton className="h-12 w-[300px]" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fairness & Bias Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          Monitor anonymized candidate evaluation data to detect and prevent systemic bias.
        </p>
      </div>

      {stats ? (
        <>
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCandidates}</div>
                <p className="text-xs text-muted-foreground">Unique anonymized profiles</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Evaluations</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEvaluations}</div>
                <p className="text-xs text-muted-foreground">Total tests completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Pass Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.passRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Across all evaluations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Mean performance</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>Frequency of candidate scores across ranges.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: {
                      label: "Candidates",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px] w-full"
                >
                  <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3"/>
                    <XAxis dataKey="range" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pass / Fail Ratio</CardTitle>
                <CardDescription>Proportion of successful vs unsuccessful evaluations.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center">
                <ChartContainer
                  config={{
                    Passed: {
                      label: "Passed",
                      color: "hsl(var(--chart-2))",
                    },
                    Failed: {
                      label: "Failed",
                      color: "hsl(var(--destructive))",
                    },
                  }}
                  className="h-[300px] w-full"
                >
                  <PieChart>
                    <Pie
                      data={passFailData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                    >
                      {passFailData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/50">
          <p className="text-muted-foreground">No candidate evaluation data available yet.</p>
        </div>
      )}

      {/* Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Anonymized Candidate Results</CardTitle>
          <CardDescription>
            Detailed logs of evaluations with all personally identifiable information redacted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Test Title</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{result.candidate_id}</TableCell>
                    <TableCell>{result.test_title}</TableCell>
                    <TableCell>{result.score} / {result.max_score}</TableCell>
                    <TableCell>{Math.round(result.percentage)}%</TableCell>
                    <TableCell>
                      <Badge variant={result.passed ? "default" : "destructive"}>
                        {result.passed ? "Passed" : "Failed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(result.completed_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No results to display.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
