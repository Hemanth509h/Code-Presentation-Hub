import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Send, Users, Inbox, CheckCircle2, XCircle,
  Clock, Eye, EyeOff, Star, Shield, Briefcase, ChevronDown, ChevronUp, X,
} from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui-elements";
import { ChatBox } from "@/shared/components/chat-box";
import { useAppStore } from "@/store/use-app-store";
import { MessageSquare } from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────
const scoreColor = (s) => s >= 80 ? "text-emerald-600" : s >= 60 ? "text-yellow-600" : "text-red-500";
const scoreBg = (s) => s >= 80 ? "bg-emerald-100 text-emerald-700" : s >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";

function ScoreBar({ value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-yellow-400" : "bg-red-400"}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums w-9 text-right ${scoreColor(value)}`}>{value}%</span>
    </div>
  );
}

function SkillPills({ skills = [] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {skills.slice(0, 4).map(s => (
        <span key={s} className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full border border-primary/20">{s}</span>
      ))}
      {skills.length > 4 && <span className="px-1.5 py-0.5 text-[10px] text-muted-foreground bg-secondary rounded-full">+{skills.length - 4}</span>}
    </div>
  );
}

const statusConfig = {
  pending: { label: "Pending", icon: Clock, cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  accepted: { label: "Accepted ✓", icon: CheckCircle2, cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  declined: { label: "Declined", icon: XCircle, cls: "bg-red-100 text-red-700 border-red-200" },
};

// ── Interest Modal ────────────────────────────────────────────────────────────
function InterestModal({ candidate, onConfirm, onClose }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    await onConfirm(candidate.maskedId, message);
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
        <Card className="w-full max-w-md shadow-2xl border-primary/20">
          <div className="p-5 border-b flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">Send Interest</h3>
              <p className="text-xs text-muted-foreground mt-0.5">to {candidate.maskedId}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <CardContent className="p-5 space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-2 text-sm">
              <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span className="text-muted-foreground">Their identity remains hidden until they accept this request.</span>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Optional message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                placeholder="We're impressed by your skill profile and would love to connect..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">Cancel</button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {sending ? <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> : <Send className="w-4 h-4" />}
                Send Interest
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ── Candidate Row ─────────────────────────────────────────────────────────────
function CandidateRow({ candidate, onShortlist, onConnect, compact = false }) {
  const rankNum = candidate.rank ?? 0;
  const displayName = candidate.realName || candidate.maskedId || "Unknown Candidate";
  const isRevealed = !!candidate.realName;

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-all ${compact ? "flex-wrap" : ""}`}>
      {/* Rank */}
      <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${rankNum > 0 && rankNum <= 3 ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
        {rankNum > 0 && rankNum <= 3 ? ["🥇","🥈","🥉"][rankNum - 1] : (rankNum || "—")}
      </div>

      {/* Identity & meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {isRevealed ? (
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <Eye className="w-4 h-4" /> {displayName}
            </span>
          ) : (
            <span className="font-semibold text-primary flex items-center gap-1">
              <EyeOff className="w-3.5 h-3.5 opacity-50" /> {displayName}
            </span>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Briefcase className="w-3 h-3" />{candidate.targetRole}</span>
          <span className="text-xs text-muted-foreground">{candidate.experienceYears}y exp</span>
        </div>
        {candidate.realEmail && (
          <div className="mt-1 text-xs flex items-center gap-1">
            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md border border-emerald-100">
              {candidate.realEmail}
            </span>
          </div>
        )}
        {!candidate.realEmail && candidate.maskedId && (
          <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <span className="font-mono bg-secondary px-1.5 py-0.5 rounded">ID: {candidate.maskedId}</span>
            <span>·</span>
            <span>{candidate.targetRole}</span>
            <span>·</span>
            <span>{candidate.experienceYears}y exp</span>
          </div>
        )}
        <div className="mt-1.5"><SkillPills skills={candidate.skills} /></div>
      </div>

      {/* Score */}
      <div className="w-36 shrink-0 hidden sm:block">
        <ScoreBar value={candidate.overallScore ?? 0} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {candidate.connectionStatus ? (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${statusConfig[candidate.connectionStatus]?.cls}`}>
            {candidate.connectionStatus === "accepted" ? "Accepted ✓" : candidate.connectionStatus === "declined" ? "Declined" : "Pending"}
          </span>
        ) : (
          <>
            <button
              onClick={() => onShortlist(candidate)}
              className={`p-2 rounded-lg transition-colors ${candidate.isShortlisted ? "text-red-500 bg-red-50 hover:bg-red-100" : "text-muted-foreground hover:text-red-400 hover:bg-red-50"}`}
              title={candidate.isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
            >
              <Heart className={`w-4 h-4 ${candidate.isShortlisted ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={() => onConnect(candidate)}
              className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Interest
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Discover Tab ─────────────────────────────────────────────────────────────
function DiscoverTab({ pool, loading, onShortlist, onConnect, roleFilter, setRoleFilter }) {
  const roles = [...new Set(pool.map(c => c.targetRole))];
  const filtered = roleFilter === "all" ? pool : pool.filter(c => c.targetRole === roleFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Filter by role:</span>
        {["all", ...roles].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 text-sm rounded-xl border transition-colors font-medium ${roleFilter === r ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-secondary text-muted-foreground"}`}>
            {r === "all" ? "All Roles" : r}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed rounded-2xl text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No candidates available for this role yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <CandidateRow key={c.maskedId} candidate={c} onShortlist={onShortlist} onConnect={onConnect} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shortlist Tab ─────────────────────────────────────────────────────────────
function ShortlistTab({ items, loading, onShortlist, onConnect }) {
  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;

  if (items.length === 0) return (
    <div className="py-16 text-center border border-dashed rounded-2xl text-muted-foreground">
      <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="font-medium">Your shortlist is empty.</p>
      <p className="text-sm mt-1">Heart a candidate in the Discover tab to save them here.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{items.length}</span> candidate{items.length !== 1 ? "s" : ""} saved — sorted by score.
      </p>
      {items.map(c => <CandidateRow key={c.maskedId} candidate={c} onShortlist={onShortlist} onConnect={onConnect} />)}
    </div>
  );
}

// ── Connections Tab ───────────────────────────────────────────────────────────
function ConnectionsTab({ connections, loading, recruiterId }) {
  const [activeChat, setActiveChat] = useState(null); // { testId, candidateId }
  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;

  if (connections.length === 0) return (
    <div className="py-16 text-center border border-dashed rounded-2xl text-muted-foreground">
      <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="font-medium">No interest requests sent yet.</p>
      <p className="text-sm mt-1">Find candidates in the Discover tab and send interest.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {connections.map(c => {
        const s = statusConfig[c.status] || statusConfig.pending;
        const Icon = s.icon;
        return (
          <div key={c.connectionId} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card">
            <div className={`p-2 rounded-xl ${s.cls} shrink-0`}><Icon className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <span className="font-semibold">
                    {c.status === "accepted" && c.realCandidateId ? (
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700 font-mono">{c.realCandidateId}</span>
                        <span className="text-xs text-muted-foreground ml-1">(identity revealed)</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                        {c.maskedId}
                      </span>
                    )}
                  </span>
                  {c.message && <p className="text-sm text-muted-foreground mt-0.5 italic">"{c.message}"</p>}
                </div>
                
                <div className="flex items-center gap-2">
                  {c.status === "accepted" && c.realCandidateId && c.customTestId && (
                    <button
                      onClick={() => setActiveChat({ testId: c.customTestId, candidateId: c.realCandidateId })}
                      className="px-3 py-1 rounded-lg border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/5 transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Chat
                    </button>
                  )}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${s.cls}`}>
                    <Icon className="w-3.5 h-3.5" /> {s.label}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Sent {new Date(c.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        );
      })}

      {activeChat && (
        <ChatBox
          customTestId={activeChat.testId}
          candidateId={activeChat.candidateId}
          role="recruiter"
          senderId={recruiterId}
          defaultOpen={true}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function BlindRecruitmentTab() {
  const { user } = useAppStore();
  const recruiterId = user?.id;
  const [subTab, setSubTab] = useState("discover");
  const [pool, setPool] = useState([]);
  const [shortlist, setShortlist] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loadingPool, setLoadingPool] = useState(true);
  const [loadingShortlist, setLoadingShortlist] = useState(false);
  const [loadingConns, setLoadingConns] = useState(false);
  const [interestTarget, setInterestTarget] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");

  const fetchPool = useCallback(async () => {
    setLoadingPool(true);
    const res = await fetch("/api/recruiters/blind-pool", { credentials: "include" });
    if (res.ok) setPool(await res.json());
    setLoadingPool(false);
  }, []);

  const fetchShortlist = useCallback(async () => {
    setLoadingShortlist(true);
    const res = await fetch("/api/recruiters/shortlist", { credentials: "include" });
    if (res.ok) setShortlist(await res.json());
    setLoadingShortlist(false);
  }, []);

  const fetchConnections = useCallback(async () => {
    setLoadingConns(true);
    const res = await fetch("/api/recruiters/connections", { credentials: "include" });
    if (res.ok) setConnections(await res.json());
    setLoadingConns(false);
  }, []);

  useEffect(() => { fetchPool(); }, [fetchPool]);
  useEffect(() => { if (subTab === "shortlist") fetchShortlist(); }, [subTab, fetchShortlist]);
  useEffect(() => { if (subTab === "connections") fetchConnections(); }, [subTab, fetchConnections]);

  const handleShortlist = async (candidate) => {
    const method = candidate.isShortlisted ? "DELETE" : "POST";
    const res = await fetch(`/api/recruiters/shortlist/${encodeURIComponent(candidate.maskedId)}`, { method, credentials: "include" });
    if (res.ok) {
      setPool(prev => prev.map(c => c.maskedId === candidate.maskedId ? { ...c, isShortlisted: !c.isShortlisted } : c));
      if (subTab === "shortlist") fetchShortlist();
    }
  };

  const handleConnect = (candidate) => setInterestTarget(candidate);

  const confirmConnect = async (maskedId, message) => {
    const res = await fetch(`/api/recruiters/connect/${encodeURIComponent(maskedId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message }),
    });
    if (res.ok) {
      setInterestTarget(null);
      fetchPool();
      if (subTab === "connections") fetchConnections();
    }
  };

  const TABS = [
    { id: "discover", label: "Discover", icon: Users, badge: pool.length },
    { id: "shortlist", label: "Shortlist", icon: Heart, badge: pool.filter(c => c.isShortlisted).length },
    { id: "connections", label: "Connections", icon: Inbox, badge: connections.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 60%)" }} />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-indigo-300" />
              <span className="text-indigo-300 text-sm font-medium">Bias-Free Hiring</span>
            </div>
            <h2 className="text-2xl font-bold">Blind Recruitment</h2>
            <p className="text-slate-300 text-sm mt-1 max-w-lg">
              Browse candidates ranked purely by skill scores. Identities stay hidden until a candidate accepts your interest request.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-xl p-3 text-center min-w-[90px]">
              <p className="text-2xl font-bold">{pool.length}</p>
              <p className="text-xs text-slate-300">In Pool</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center min-w-[90px]">
              <p className="text-2xl font-bold">{connections.filter(c => c.status === "accepted").length}</p>
              <p className="text-xs text-slate-300">Accepted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-xl w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${subTab === tab.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${subTab === tab.id ? "bg-primary/10 text-primary" : "bg-border text-muted-foreground"}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={subTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
          {subTab === "discover" && (
            <DiscoverTab pool={pool} loading={loadingPool} onShortlist={handleShortlist} onConnect={handleConnect} roleFilter={roleFilter} setRoleFilter={setRoleFilter} />
          )}
          {subTab === "shortlist" && (
            <ShortlistTab items={shortlist} loading={loadingShortlist} onShortlist={handleShortlist} onConnect={handleConnect} />
          )}
          {subTab === "connections" && (
            <ConnectionsTab connections={connections} loading={loadingConns} recruiterId={recruiterId} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Interest modal */}
      <AnimatePresence>
        {interestTarget && (
          <InterestModal candidate={interestTarget} onConfirm={confirmConnect} onClose={() => setInterestTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
