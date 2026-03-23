import { useLocation, Link } from "wouter";
import { useAppStore } from "@/store/use-app-store";
import { useGetCandidateResults } from "@/lib/api";
import {
  AnimatedPage,
  Card,
  CardContent,
  Badge,
  Button,
} from "@/components/ui-elements";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Calendar,
  Trophy,
} from "lucide-react";
import { format } from "date-fns";

export default function CandidateResults() {
  const [_, setLocation] = useLocation();
  const { candidateId } = useAppStore();

  if (!candidateId) {
    setLocation("/");
    return null;
  }

  const { data: results, isLoading } = useGetCandidateResults(candidateId);

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AnimatedPage className="max-w-5xl mx-auto px-4 py-10 w-full">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">My Results</h1>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Overall Rank: #{results?.rank || "N/A"}
        </div>
      </div>

      {!results?.assessments.length ? (
        <Card className="text-center p-12 bg-secondary/30 border-dashed">
          <CardContent className="flex flex-col items-center">
            <Trophy className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No results yet</h3>
            <p className="text-muted-foreground mb-6">
              Complete an assessment to see your scores here.
            </p>
            <Link href="/dashboard">
              <Button>Take an Assessment</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {results.assessments.map((res) => {
            const isPassed = res.percentage >= 60;
            return (
              <Card key={res.assessmentId} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div
                    className={`p-6 md:w-48 flex flex-col items-center justify-center text-white ${
                      isPassed ? "bg-green-600" : "bg-red-500"
                    }`}
                  >
                    <span className="text-5xl font-bold font-mono">
                      {res.percentage}%
                    </span>
                    <span className="font-medium mt-1 opacity-90">
                      {res.score} / {res.maxScore} pts
                    </span>
                  </div>
                  <CardContent className="p-6 flex-grow flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Badge className="mb-2 capitalize">
                          {res.assessmentType}
                        </Badge>
                        <h3 className="text-2xl font-bold">
                          {res.assessmentTitle}
                        </h3>
                      </div>
                      {isPassed ? (
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                      <Calendar className="w-4 h-4" />
                      Completed on{" "}
                      {format(
                        new Date(res.completedAt),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AnimatedPage>
  );
}
