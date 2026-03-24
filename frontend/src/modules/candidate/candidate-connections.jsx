import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Inbox, Shield } from "lucide-react";

const statusConfig = {
  pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  accepted: { label: "Accepted", cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  declined: { label: "Declined", cls: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

export function CandidateConnections({ candidateId }) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/recruiters/pending-for-candidate/${candidateId}`);
      if (res.ok) setConnections(await res.json());
    } catch (_) {}
    setLoading(false);
  }, [candidateId]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const respond = async (connectionId, decision) => {
    setResponding(connectionId);
    try {
      const res = await fetch(`/api/recruiters/respond/${connectionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) {
        setConnections(prev =>
          prev.map(c => c.connectionId === connectionId ? { ...c, status: decision } : c)
        );
      }
    } catch (_) {}
    setResponding(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (connections.length === 0) return null;

  const pending = connections.filter(c => c.status === "pending");

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <Inbox className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Recruiter Interest</h2>
        {pending.length > 0 && (
          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
            {pending.length} pending
          </span>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {connections.map((c, i) => {
            const s = statusConfig[c.status] || statusConfig.pending;
            const Icon = s.icon;
            return (
              <motion.div
                key={c.connectionId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card"
              >
                <div className={`p-2 rounded-xl border ${s.cls} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold">{c.recruiterAlias}</p>
                      {c.message && (
                        <p className="text-sm text-muted-foreground mt-0.5 italic">"{c.message}"</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>

                    {c.status === "pending" ? (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => respond(c.connectionId, "declined")}
                          disabled={!!responding}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => respond(c.connectionId, "accepted")}
                          disabled={!!responding}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {responding === c.connectionId ? (
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Accept
                        </button>
                      </div>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${s.cls}`}>
                        <Icon className="w-3.5 h-3.5" /> {s.label}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {connections.length > 0 && (
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5">
          <Shield className="w-4 h-4 text-primary shrink-0" />
          <span>
            Your personal identity is only shared with a recruiter after you <strong>accept</strong> their request.
          </span>
        </div>
      )}
    </div>
  );
}
