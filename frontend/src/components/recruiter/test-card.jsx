import { useState } from "react";
import { Card, CardContent, Button } from "@/components/ui-elements";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Trash2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AssignModal } from "./assign-modal";

export function TestCard({ test, onRefresh, onDelete }) {
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
