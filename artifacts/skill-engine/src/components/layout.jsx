import { Link, useLocation } from "wouter";
import { useAppStore } from "@/store/use-app-store";
import { supabase } from "@/lib/supabase";
import { Button } from "./ui-elements";
import {
  ShieldCheck,
  UserCircle,
  LogOut,
  LayoutDashboard,
  LogIn,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";

export function Layout({ children }) {
  const [_, setLocation] = useLocation();
  const { candidateId, isRecruiterMode, toggleRecruiterMode, logout, user } =
    useAppStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
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

          <div className="flex items-center gap-3">
            {user && candidateId && !isRecruiterMode && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-secondary text-sm font-medium">
                <UserCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">ID:</span>
                <span className="text-foreground font-mono">{candidateId}</span>
              </div>
            )}

            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleRecruiterMode}
                className="gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                {isRecruiterMode ? "Candidate View" : "Recruiter View"}
              </Button>
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
