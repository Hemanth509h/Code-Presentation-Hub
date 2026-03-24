import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAppStore } from "@/store/use-app-store";
import {
  useGetCandidateProfile,
  useListAssessments,
} from "@/lib/api";
import {
  AnimatedPage,
  Card,
  CardContent,
  Badge,
  Button,
} from "@/shared/components/ui-elements";
import { ChatBox } from "@/shared/components/chat-box";
import { CandidateConnections } from "@/modules/candidate/candidate-connections";
import {
  Clock,
  HelpCircle,
  Code2,
  Brain,
  Wrench,
  Trophy,
  ArrowRight,
  ClipboardList,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { motion } from "framer-motion";

const iconMap = {
  coding: <Code2 className="w-5 h-5 text-blue-500" />,
  aptitude: <Brain className="w-5 h-5 text-purple-500" />,
  technical: <Wrench className="w-5 h-5 text-orange-500" />,
};

const TYPE_COLOR = {
  technical: "bg-orange-100 text-orange-700",
  coding: "bg-blue-100 text-blue-700",
  aptitude: "bg-purple-100 text-purple-700",
};

function AssignedTestsSection({ candidateId }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null); // { testId, title }
  const [_, setLocation] = useLocation();

  useEffect(() => {
    fetch(`/api/candidates/${candidateId}/assigned-tests`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setTests)
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }, [candidateId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (tests.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Custom Assessments</h2>
        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
          {tests.filter((t) => t.status === "pending").length} pending
        </span>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test, i) => {
          const done = test.status === "completed";
          return (
            <motion.div
              key={test.customTestId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className={`h-full flex flex-col border-border/50 ${done ? "opacity-80" : "hover:-translate-y-1 transition-transform duration-300"}`}>
                <CardContent className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-secondary">
                      {iconMap[test.type] || <ClipboardList className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TYPE_COLOR[test.type] || "bg-secondary text-foreground"}`}>
                        {test.type}
                      </span>
                      {done && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          {test.passed
                            ? <><CheckCircle2 className="w-3 h-3 text-green-500" /> Passed</>
                            : <><XCircle className="w-3 h-3 text-red-500" /> Not passed</>}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-2">{test.title}</h3>
                  {test.description && (
                    <p className="text-muted-foreground text-sm flex-grow mb-4">{test.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm font-medium text-foreground/80 mb-6 bg-secondary/30 p-3 rounded-lg">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary" />
                      {test.durationMinutes} mins
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-primary" />
                      {test.questionCount} Questions
                    </div>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => setActiveChat({ testId: test.customTestId, title: test.title })}
                    >
                      <MessageSquare className="w-4 h-4" /> Chat
                    </Button>
                    {!done && (
                      <Button
                        className="flex-[2]"
                        onClick={() => setLocation(`/custom-test/${test.customTestId}`)}
                      >
                        Start Test
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {activeChat && (
        <ChatBox
          customTestId={activeChat.testId}
          candidateId={candidateId}
          role="candidate"
          senderId={candidateId}
          defaultOpen={true}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
}

export default function CandidateDashboard() {
  const [_, setLocation] = useLocation();
  const { candidateId } = useAppStore();

  if (!candidateId) {
    setLocation("/");
    return null;
  }

  const { data: profile, isLoading: loadingProfile } = useGetCandidateProfile(candidateId);
  const { data: assessments, isLoading: loadingAssessments } = useListAssessments();

  if (loadingProfile || loadingAssessments) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AnimatedPage className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 mb-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Welcome, <span className="text-primary-foreground/80">{candidateId}</span>
            </h1>
            <p className="text-slate-300 max-w-xl">
              Target Role: <span className="font-semibold text-white">{profile?.targetRole}</span> · {profile?.experienceYears} YOE
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {profile?.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="bg-white/10 text-white border-none hover:bg-white/20">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center min-w-[140px]">
              <Trophy className="w-8 h-8 text-yellow-400 mb-2" />
              <span className="text-sm text-slate-300 font-medium whitespace-nowrap">Overall Score</span>
              <span className="text-3xl font-bold font-mono">
                {profile?.overallScore !== undefined && profile?.overallScore !== null
                  ? `${profile.overallScore}%`
                  : "N/A"}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center min-w-[140px]">
              <Trophy className="w-8 h-8 text-blue-400 mb-2" />
              <span className="text-sm text-slate-300 font-medium whitespace-nowrap">Global Rank</span>
              <span className="text-3xl font-bold font-mono">
                {profile?.rank !== undefined && profile?.rank !== null
                  ? `#${profile.rank}`
                  : "N/A"}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center min-w-[140px]">
              <Trophy className="w-8 h-8 text-teal-400 mb-2" />
              <span className="text-sm text-slate-300 font-medium whitespace-nowrap">Role Rank</span>
              <span className="text-3xl font-bold font-mono">
                {profile?.roleRank !== undefined && profile?.roleRank !== null
                  ? `#${profile.roleRank}`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <CandidateConnections candidateId={candidateId} />

      <AssignedTestsSection candidateId={candidateId} />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Available Assessments</h2>
        <Link href="/results">
          <Button variant="outline" className="gap-2">
            View My Results <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assessments?.map((assessment, i) => (
          <motion.div
            key={assessment.assessmentId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="h-full flex flex-col hover:-translate-y-1 transition-transform duration-300 border-border/50">
              <CardContent className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-secondary">
                    {iconMap[assessment.type]}
                  </div>
                  <Badge className="capitalize">{assessment.type}</Badge>
                </div>
                <h3 className="text-xl font-bold mb-2">{assessment.title}</h3>
                <p className="text-muted-foreground text-sm flex-grow mb-6">{assessment.description}</p>
                <div className="flex items-center gap-4 text-sm font-medium text-foreground/80 mb-6 bg-secondary/30 p-3 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    {assessment.durationMinutes} mins
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-primary" />
                    {assessment.totalQuestions} Questions
                  </div>
                </div>
                <Link href={`/assessment/${assessment.assessmentId}`} className="mt-auto">
                  <Button className="w-full">Start Assessment</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <ChatBox customTestId="general" candidateId={candidateId} role="candidate" senderId={candidateId} />
    </AnimatedPage>
  );
}
