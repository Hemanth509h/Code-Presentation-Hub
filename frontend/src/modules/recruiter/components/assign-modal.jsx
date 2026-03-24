import { useState } from "react";
import { Button, Input, Label } from "@/shared/components/ui-elements";
import { X, CheckCircle2, Send } from "lucide-react";
import { motion } from "framer-motion";

export function AssignModal({ test, onClose, onAssigned }) {
  const [candidateId, setCandidateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleAssign = async () => {
    if (!candidateId.trim()) { setError("Enter a Candidate ID"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/custom-tests/${test.customTestId}/assign`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidateId.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Assignment failed"); setLoading(false); return; }
      setSuccess(true);
      onAssigned();
    } catch (_) {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Assign Test</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Assign <strong>{test.title}</strong> to a candidate
        </p>

        {success ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-green-600">Assigned successfully!</p>
            <Button className="mt-4 w-full" variant="outline" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <Label>Candidate ID</Label>
              <Input
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                placeholder="e.g. CND-1234"
                onKeyDown={(e) => e.key === "Enter" && handleAssign()}
              />
            </div>
            {error && <p className="text-sm text-destructive mb-3">{error}</p>}
            <Button className="w-full gap-2" isLoading={loading} onClick={handleAssign}>
              <Send className="w-4 h-4" /> Assign Test
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
