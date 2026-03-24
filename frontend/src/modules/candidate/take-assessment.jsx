import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useAppStore } from "@/store/use-app-store";
import {
  useGetAssessment,
  useSubmitAssessment,
} from "@/lib/api";
import {
  AnimatedPage,
  Button,
  Card,
  CardContent,
} from "@/shared/components/ui-elements";
import { formatTime } from "@/lib/utils";
import { Clock, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TakeAssessment() {
  const [match, params] = useRoute("/assessment/:id");
  const [_, setLocation] = useLocation();
  const { candidateId } = useAppStore();
  const assessmentId = params?.id || "";

  const { data: assessment, isLoading } = useGetAssessment(assessmentId, {
    query: { enabled: !!assessmentId },
  });
  const { mutate: submit, isPending: isSubmitting } = useSubmitAssessment(assessmentId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    if (!candidateId) {
      setLocation("/");
    }
  }, [candidateId, setLocation]);

  useEffect(() => {
    if (assessment && timeLeft === null) {
      setTimeLeft(assessment.durationMinutes * 60);
    }
  }, [assessment, timeLeft]);

  useEffect(() => {
    if (timeLeft === null || isFinished) return;
    if (timeLeft <= 0) {
      handleFinalSubmit();
      return;
    }
    const timer = setInterval(
      () => setTimeLeft((prev) => (prev || 0) - 1),
      1000
    );
    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  const handleOptionSelect = (qId, optIdx) => {
    setAnswers((prev) => ({ ...prev, [qId]: { selectedOption: optIdx } }));
  };

  const handleTextAnswer = (qId, text) => {
    setAnswers((prev) => ({ ...prev, [qId]: { textAnswer: text } }));
  };

  const handleNext = () => {
    if (assessment && currentIndex < assessment.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFinalSubmit = () => {
    if (!candidateId || !assessment) return;
    setIsFinished(true);

    const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
      questionId: qId,
      ...ans,
    }));

    assessment.questions.forEach((q) => {
      if (!answers[q.questionId]) {
        formattedAnswers.push({ questionId: q.questionId });
      }
    });

    submit(
      {
        assessmentId,
        data: {
          candidateId,
          answers: formattedAnswers,
        },
      },
      {
        onSuccess: (data) => setResultData(data),
        onError: () => {
          setIsFinished(false);
        },
      }
    );
  };

  if (isLoading || !assessment) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
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
                resultData.passed
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              <CheckCircle2 className="w-12 h-12" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-2">Assessment Complete</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              You scored{" "}
              <span className="font-bold text-foreground">
                {resultData.score} / {resultData.maxScore}
              </span>{" "}
              ({resultData.percentage}%)
            </p>
            <div
              className={`p-4 rounded-xl mb-8 w-full ${
                resultData.passed
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {resultData.feedback}
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={() => setLocation("/dashboard")}
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </AnimatedPage>
    );
  }

  const question = assessment.questions[currentIndex];
  const progress =
    ((currentIndex + 1) / assessment.questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full flex-grow flex flex-col">
      {/* Header / Progress */}
      <div className="flex items-center justify-between mb-8 bg-card border shadow-sm rounded-2xl p-4">
        <div>
          <h2 className="font-bold text-lg">{assessment.title}</h2>
          <p className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {assessment.questions.length}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-secondary px-4 py-2 rounded-xl font-mono text-lg font-bold text-primary">
          <Clock className="w-5 h-5" />
          {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-secondary h-2 rounded-full mb-10 overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.questionId}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-grow flex flex-col"
        >
          <Card className="flex-grow flex flex-col border-primary/10 shadow-lg">
            <CardContent className="p-8 md:p-12 flex-grow">
              <div className="mb-8">
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-4 uppercase tracking-wider">
                  {question.type.replace("_", " ")} • {question.points} Points
                </span>
                <h3 className="text-2xl font-medium leading-relaxed text-foreground">
                  {question.text}
                </h3>
              </div>

              {question.type === "multiple_choice" && question.options && (
                <div className="space-y-4 mt-8">
                  {question.options.map((opt, idx) => {
                    const isSelected =
                      answers[question.questionId]?.selectedOption === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() =>
                          handleOptionSelect(question.questionId, idx)
                        }
                        className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                            : "border-border bg-background hover:border-primary/40 hover:bg-secondary/50"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? "border-primary"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-3 h-3 bg-primary rounded-full" />
                          )}
                        </div>
                        <span className="text-lg font-medium">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {question.type !== "multiple_choice" && (
                <div className="mt-8 h-64">
                  <textarea
                    className="w-full h-full p-4 rounded-xl border-2 border-input bg-background focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all resize-none font-mono text-sm"
                    placeholder="Enter your answer here..."
                    value={answers[question.questionId]?.textAnswer || ""}
                    onChange={(e) =>
                      handleTextAnswer(question.questionId, e.target.value)
                    }
                  />
                </div>
              )}
            </CardContent>

            <div className="p-6 bg-secondary/30 border-t flex justify-between items-center rounded-b-2xl">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </Button>

              {currentIndex < assessment.questions.length - 1 ? (
                <Button onClick={handleNext} className="gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinalSubmit}
                  isLoading={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-green-600/20"
                >
                  Submit Assessment
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
