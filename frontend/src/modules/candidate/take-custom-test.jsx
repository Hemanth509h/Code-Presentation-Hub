import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useAppStore } from "@/store/use-app-store";
import { AnimatedPage, Button, Card, CardContent } from "@/shared/components/ui-elements";
import { formatTime } from "@/lib/utils";
import { Clock, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatBox } from "@/shared/components/chat-box";

export default function TakeCustomTest() {
  const [match, params] = useRoute("/custom-test/:testId");
  const [_, setLocation] = useLocation();
  const { candidateId } = useAppStore();
  const testId = params?.id || params?.testId || "";

  const [test, setTest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!candidateId) {
      setLocation("/");
      return;
    }
    fetch(`/api/custom-tests/${testId}/take`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        setTest(data);
        setTimeLeft(data.durationMinutes * 60);
        setIsLoading(false);
      })
      .catch(() => {
        setError("Test not found or you are not assigned to it.");
        setIsLoading(false);
      });
  }, [testId, candidateId, setLocation]);

  useEffect(() => {
    if (timeLeft === null || isFinished) return;
    if (timeLeft <= 0) { handleFinalSubmit(); return; }
    const timer = setInterval(() => setTimeLeft((p) => (p || 0) - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  const handleOptionSelect = (qId, optIdx) => {
    setAnswers((prev) => ({ ...prev, [qId]: { selectedOption: optIdx } }));
  };

  const handleTextAnswer = (qId, text) => {
    setAnswers((prev) => ({ ...prev, [qId]: { textAnswer: text } }));
  };

  const handleFinalSubmit = async () => {
    if (!candidateId || !test) return;
    setIsFinished(true);

    const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
      questionId: qId,
      ...ans,
    }));
    test.questions.forEach((q) => {
      if (!answers[q.questionId]) formattedAnswers.push({ questionId: q.questionId });
    });

    try {
      const res = await fetch(`/api/custom-tests/${testId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, answers: formattedAnswers }),
      });
      if (res.ok) {
        const data = await res.json();
        setResultData(data);
      } else {
        const err = await res.json();
        setError(err.message || "Submission failed");
        setIsFinished(false);
      }
    } catch (_) {
      setError("Network error. Please try again.");
      setIsFinished(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <AnimatedPage className="flex-grow flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-10 pb-8">
            <p className="text-destructive font-medium mb-4">{error}</p>
            <Button onClick={() => setLocation("/dashboard")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </AnimatedPage>
    );
  }

  if (resultData) {
    return (
      <AnimatedPage className="flex-grow flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center shadow-2xl">
          <CardContent className="pt-10 pb-8 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
                resultData.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              }`}
            >
              <CheckCircle2 className="w-12 h-12" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-1">Test Complete</h2>
            <p className="text-muted-foreground mb-6">{test?.title}</p>
            <div className="w-full bg-secondary/50 rounded-xl p-4 mb-4 border border-secondary">
              <p className="text-4xl font-bold font-mono text-primary">{resultData.percentage}%</p>
              <p className="text-sm text-muted-foreground mt-1">
                {resultData.score} / {resultData.maxScore} pts
              </p>
            </div>
            <p className={`text-sm font-semibold mb-2 ${resultData.passed ? "text-green-600" : "text-red-600"}`}>
              {resultData.passed ? "PASSED" : "NOT PASSED"}
            </p>
            <p className="text-muted-foreground text-sm mb-8">{resultData.feedback}</p>
            <Button className="w-full" onClick={() => setLocation("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </AnimatedPage>
    );
  }

  if (!test) return null;
  const question = test.questions[currentIndex];

  return (
    <AnimatedPage className="max-w-3xl mx-auto px-4 py-10 w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">{test.title}</h1>
          <p className="text-sm text-muted-foreground capitalize">{test.type} · Custom Test</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg ${
          (timeLeft || 0) < 60 ? "bg-red-100 text-red-600" : "bg-secondary text-foreground"
        }`}>
          <Clock className="w-4 h-4" />
          {formatTime(timeLeft || 0)}
        </div>
      </div>

      <div className="flex gap-1.5 mb-6 flex-wrap">
        {test.questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
              i === currentIndex
                ? "bg-primary text-white"
                : answers[test.questions[i].questionId]
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {currentIndex + 1}
                </span>
                <p className="text-lg font-medium">{question.text}</p>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{question.points} pt{question.points !== 1 ? "s" : ""}</p>

              {question.type === "multiple_choice" && question.options ? (
                <div className="space-y-3">
                  {question.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(question.questionId, idx)}
                      className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all font-medium ${
                        answers[question.questionId]?.selectedOption === idx
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input hover:border-primary/50 hover:bg-secondary/30"
                      }`}
                    >
                      <span className="font-bold mr-3 text-muted-foreground">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  className="w-full h-48 p-4 rounded-xl border-2 border-input bg-background focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all resize-none font-mono text-sm"
                  placeholder="Enter your answer here..."
                  value={answers[question.questionId]?.textAnswer || ""}
                  onChange={(e) => handleTextAnswer(question.questionId, e.target.value)}
                />
              )}
            </CardContent>

            <div className="p-6 bg-secondary/30 border-t flex justify-between items-center rounded-b-2xl">
              <Button variant="outline" onClick={() => setCurrentIndex((p) => p - 1)} disabled={currentIndex === 0} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Previous
              </Button>
              {currentIndex < test.questions.length - 1 ? (
                <Button onClick={() => setCurrentIndex((p) => p + 1)} className="gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinalSubmit}
                  isLoading={isFinished}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-green-600/20"
                >
                  Submit Test
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
      <ChatBox customTestId={testId} candidateId={candidateId} role="candidate" senderId={candidateId} />
    </AnimatedPage>
  );
}
