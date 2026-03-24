import { Link, useLocation } from "wouter";
import { useAppStore, getUserRole } from "@/store/use-app-store";
import { Button } from "../components/ui-elements";
import {
  ShieldCheck,
  UserCircle,
  LogOut,
  LogIn,
  Users,
  Shield,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";

const ROLE_BADGE = {
  candidate: { label: "Candidate", color: "bg-blue-100 text-blue-700" },
  recruiter: { label: "Recruiter", color: "bg-purple-100 text-purple-700" },
  admin: { label: "Admin", color: "bg-red-100 text-red-700" },
};

const ROLE_ICON = {
  candidate: <UserCircle className="w-4 h-4" />,
  recruiter: <Users className="w-4 h-4" />,
  admin: <Shield className="w-4 h-4" />,
};

export function Layout({ children }) {
  const [_, setLocation] = useLocation();
  const { candidateId, logout, user } = useAppStore();
  const role = getUserRole(user);
  const badge = ROLE_BADGE[role] || ROLE_BADGE.candidate;

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href={user ? "/" : "/login"}
            className="flex items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              SkillEngine
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {(role === "admin" || role === "recruiter") && (
              <Link href="/fairness" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors hidden sm:flex items-center px-2">
                Fairness Dashboard
              </Link>
            )}
            {user && (
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${badge.color}`}>
                {ROLE_ICON[role]}
                {badge.label}
                {role === "candidate" && candidateId && (
                  <span className="font-mono text-xs opacity-75">· {candidateId}</span>
                )}
              </div>
            )}

            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2 text-muted-foreground"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow w-full flex flex-col relative z-0">
        <AnimatePresence mode="wait">{children}</AnimatePresence>
      </main>
    </div>
  );
}
