import { useState } from "react";
import { AnimatedPage, Card, CardContent, Badge, Button, Input, Label } from "@/shared/components/ui-elements";
import { Shield, Users, UserCircle, Briefcase, Trash2, ChevronDown, RefreshCw, Search, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CandidateManagementTab } from "./components/candidate-management-tab";

const ROLES = ["candidate", "recruiter", "admin"];

const ROLE_STYLE = {
  candidate: "bg-blue-100 text-blue-700",
  recruiter: "bg-purple-100 text-purple-700",
  admin: "bg-red-100 text-red-700",
};

const ROLE_ICON = {
  candidate: <UserCircle className="w-3.5 h-3.5" />,
  recruiter: <Briefcase className="w-3.5 h-3.5" />,
  admin: <Shield className="w-3.5 h-3.5" />,
};

async function fetchUsers() {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

async function updateUserRole({ userId, role }) {
  const res = await fetch(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error("Failed to update role");
  return res.json();
}

async function deleteUser(userId) {
  const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete user");
  return res.json();
}

function RoleDropdown({ userId, currentRole, onUpdate }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80 ${ROLE_STYLE[currentRole]}`}
      >
        {ROLE_ICON[currentRole]}
        {currentRole}
        <ChevronDown className="w-3 h-3" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full mt-1 right-0 z-10 bg-background border border-border rounded-xl shadow-lg overflow-hidden min-w-[120px]"
          >
            {ROLES.map((role) => (
              <button
                key={role}
                onClick={() => { onUpdate(userId, role); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors ${currentRole === role ? "font-semibold" : ""}`}
              >
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${ROLE_STYLE[role]}`}>
                  {ROLE_ICON[role]} {role}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminDashboard() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("users");
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => updateUserRole({ userId, role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId) => deleteUser(userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); setConfirmDelete(null); },
  });

  const users = data?.users || [];
  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.includes(search.toLowerCase())
  );

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <AnimatedPage className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-6 h-6 text-red-600" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Manage users, roles, and platform access.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><Users className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Users</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><UserCircle className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Candidates</p>
              <p className="text-2xl font-bold">{roleCounts.candidate || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Briefcase className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Recruiters</p>
              <p className="text-2xl font-bold">{roleCounts.recruiter || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg"><Shield className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Admins</p>
              <p className="text-2xl font-bold">{roleCounts.admin || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex border-b border-border mb-6 gap-8">
        <button 
          onClick={() => setActiveTab("users")} 
          className={`pb-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          System Users
        </button>
        <button 
          onClick={() => setActiveTab("candidates")} 
          className={`pb-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'candidates' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Candidate Profiles
        </button>
      </div>

      {activeTab === "users" ? (
      <Card className="overflow-hidden">
        <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-bold">All Users</h3>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by email or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
              />
            </div>
            <Button onClick={() => setIsUserModalOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> Add User
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-secondary/50 text-muted-foreground uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Joined</th>
                  <th className="px-6 py-4 font-semibold">Last Sign In</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{user.email}</td>
                    <td className="px-6 py-4">
                      <RoleDropdown
                        userId={user.id}
                        currentRole={user.role}
                        onUpdate={(uid, role) => roleMutation.mutate({ userId: uid, role })}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.emailConfirmed ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {user.emailConfirmed ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {user.lastSignIn ? new Date(user.lastSignIn).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {confirmDelete === user.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-muted-foreground">Are you sure?</span>
                          <button
                            onClick={() => deleteMutation.mutate(user.id)}
                            className="text-xs px-2 py-1 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity font-medium"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs px-2 py-1 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(user.id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      ) : (
        <CandidateManagementTab />
      )}

      {isUserModalOpen && (
        <UserModal 
          onClose={() => setIsUserModalOpen(false)} 
          onSuccess={() => { setIsUserModalOpen(false); qc.invalidateQueries({ queryKey: ["admin-users"] }); }} 
        />
      )}
    </AnimatedPage>
  );
}

function UserModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("recruiter");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role })
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed to create user.");
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
          <h3 className="font-bold text-lg">Create New User</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Email (for login)</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="user@example.com" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 chars" />
            </div>
            <div>
              <Label>Role</Label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="candidate">Candidate</option>
                <option value="recruiter">Recruiter</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {error && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                ! {error}
              </div>
            )}
            <Button type="submit" className="w-full mt-4" size="lg" isLoading={loading}>
              Create User
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
