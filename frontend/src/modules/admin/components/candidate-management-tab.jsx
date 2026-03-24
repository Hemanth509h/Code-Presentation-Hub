import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, Button, Input, Label, Badge } from "@/shared/components/ui-elements";
import { Search, Plus, Edit2, X } from "lucide-react";

export function CandidateManagementTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["admin-candidates"],
    queryFn: async () => {
      const res = await fetch("/api/admin/candidates");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  });

  const filtered = candidates.filter(c => 
    c.candidate_id.toLowerCase().includes(search.toLowerCase()) || 
    (c.target_role || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search candidates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm rounded-xl border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background w-64"
          />
        </div>
        <Button onClick={() => { setEditingCandidate(null); setIsModalOpen(true); }} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Add Candidate
        </Button>
      </div>

      <Card className="overflow-hidden border-0 shadow-xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-secondary/50 text-muted-foreground uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4 font-semibold">Candidate ID</th>
                  <th className="px-6 py-4 font-semibold">Target Role</th>
                  <th className="px-6 py-4 font-semibold">Experience</th>
                  <th className="px-6 py-4 font-semibold">Skills</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(c => (
                  <tr key={c.candidate_id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-primary">{c.candidate_id}</td>
                    <td className="px-6 py-4">{c.target_role}</td>
                    <td className="px-6 py-4">{c.experience_years} yrs</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5 flex-wrap w-56 overflow-hidden">
                        {(c.skills || []).slice(0,3).map(s => <Badge key={s} className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">{s}</Badge>)}
                        {(c.skills?.length > 3) && <Badge className="text-[10px] px-1.5 py-0">+{c.skills.length - 3}</Badge>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setEditingCandidate(c); setIsModalOpen(true); }} className="p-2 rounded-lg hover:bg-secondary text-primary transition-colors" title="Edit Profile">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No candidates found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {isModalOpen && (
        <CandidateModal 
          candidate={editingCandidate} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); qc.invalidateQueries({ queryKey: ["admin-candidates"] }); }} 
        />
      )}
    </div>
  );
}

function CandidateModal({ candidate, onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [targetRole, setTargetRole] = useState(candidate?.target_role || "");
  const [experience, setExperience] = useState(candidate?.experience_years || 0);
  const [skills, setSkills] = useState(candidate?.skills?.join(", ") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEdit = !!candidate;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      targetRole,
      experienceYears: parseInt(experience) || 0,
      skills: skills.split(",").map(s => s.trim()).filter(Boolean),
    };

    try {
      if (isEdit) {
        const res = await fetch(`/api/admin/candidates/${candidate.candidate_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error((await res.json()).message || "Failed to update candidate.");
      } else {
        const res = await fetch(`/api/admin/candidates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, email, password })
        });
        if (!res.ok) throw new Error((await res.json()).message || "Auth Registration failed. Email might be in use.");
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <div className="p-5 border-b flex justify-between items-center bg-secondary/50 rounded-t-xl">
          <h3 className="font-bold text-lg">{isEdit ? "Edit Candidate Profile" : "Create New Candidate"}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isEdit && (
              <>
                <div>
                  <Label>Email (for login)</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="candidate@example.com" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 chars" />
                </div>
                <div className="flex-1 h-px bg-border my-4" />
              </>
            )}
            <div>
              <Label>Target Role</Label>
              <Input value={targetRole} onChange={e => setTargetRole(e.target.value)} required placeholder="e.g. Frontend Engineer" />
            </div>
            <div>
              <Label>Years of Experience</Label>
              <Input type="number" min="0" value={experience} onChange={e => setExperience(e.target.value)} required />
            </div>
            <div>
              <Label>Skills (comma separated)</Label>
              <Input value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, Python, Node.js" required />
            </div>
            
            {error && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                ! {error}
              </div>
            )}
            
            <Button type="submit" className="w-full mt-4" size="lg" isLoading={loading}>
              {isEdit ? "Save Profile Changes" : "Create Candidate"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
