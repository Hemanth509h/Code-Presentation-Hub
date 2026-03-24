import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";

export default function FairnessDashboard() {
  const { data: results, isLoading, error } = useQuery({
    queryKey: ["fairnessResults"],
    queryFn: async () => {
      const res = await fetch("/api/fairness/results");
      if (!res.ok) throw new Error("Failed to fetch fairness results");
      return res.json();
    },
  });

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fairness Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          Review anonymized test results to ensure unbiased evaluations across candidates.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Anonymized Candidate Results</CardTitle>
          <CardDescription>
            All personally identifiable information has been redacted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ) : results?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              No results found.
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
