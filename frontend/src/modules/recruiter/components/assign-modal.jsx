import { useState, useEffect } from "react";
import { Button, Input, Label } from "@/shared/components/ui-elements";
import { X, CheckCircle2, Send } from "lucide-react";
import { motion } from "framer-motion";

export function AssignModal({ test, onClose, onAssigned }) {
  const [candidateId, setCandidateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [pool, setPool] = useState([]);
  const [loadingPool, setLoadingPool] = useState(true);

  useEffect(() => {
    fetch("/api/recruiters/connections", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(conns => {
        const accepted = conns.filter(c => c.status === "accepted");
        setPool(accepted);
      })
      .finally(() => setLoadingPool(false));
  }, []);

  const handleAssign = async (targetId) => {
    const cid = targetId || candidateId;
    if (!cid.trim()) { setError("Enter or select a Candidate ID"); return; }
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/custom-tests/${test.customTestId}/assign`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: cid.trim() }),
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
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-md border flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Assign {test.title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-green-600">Assigned successfully!</p>
            <Button className="mt-6 w-full" variant="outline" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <Label className="mb-2 block">Quick Assign from Pool</Label>
              <div className="border rounded-xl bg-secondary/20 overflow-hidden">
                {loadingPool ? (
                  <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Loading candidates...</div>
                ) : pool.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">No candidates in pool</div>
                ) : (
                  <div className="max-h-48 overflow-y-auto divide-y">
                    {pool.map(c => (
                      <button
                        key={c.connectionId}
                        onClick={() => handleAssign(c.maskedId)}
                        disabled={loading}
                        className="w-full px-4 py-2.5 text-left hover:bg-white transition-colors flex items-center justify-between group"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold font-mono text-primary">{c.maskedId}</span>
                          <span className="text-[10px] text-muted-foreground">Connected Candidate</span>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or Manual Entry</span></div>
            </div>

            <div className="mb-4">
              <Label>Candidate ID</Label>
              <Input
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                placeholder="e.g. CAND-001"
                onKeyDown={(e) => e.key === "Enter" && handleAssign()}
              />
            </div>
            {error && <p className="text-sm text-destructive mb-3">{error}</p>}
            <Button className="w-full gap-2" isLoading={loading} onClick={() => handleAssign()}>
              <Send className="w-4 h-4" /> Assign Test
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
