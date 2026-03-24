import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button, Input, Label } from "@/shared/components/ui-elements";
import {
  ShieldCheck,
  UserPlus,
  Eye,
  EyeOff,
  CheckCircle,
  CheckCircle2,
  Star,
  Trophy,
  Lock,
  Users,
  UserCircle,
} from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: <Lock className="w-5 h-5" />,
    title: "Secure & Private",
    desc: "Your personal details are never shared with employers.",
  },
  {
    icon: <Star className="w-5 h-5" />,
    title: "Showcase Real Skills",
    desc: "Complete assessments that prove your actual abilities.",
  },
  {
    icon: <Trophy className="w-5 h-5" />,
    title: "Get Discovered",
    desc: "Top performers get surfaced to leading companies automatically.",
  },
];

export default function Register() {
  const [_, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("candidate");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Registration failed");
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
      }
    } catch (_) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[calc(100vh-64px)] bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm mx-auto px-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
            className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Check your email!</h2>
          <p className="text-muted-foreground mb-6">
            We've sent a verification link to your email address. Please click the link to verify your account before logging in.
          </p>
          <Button onClick={() => setLocation("/login")} className="w-full">
            Go to Sign In
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex min-h-[calc(100vh-64px)]">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">SkillEngine</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Your skills.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
                Your story.
              </span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Join thousands of candidates who let their talent do the talking.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i + 0.3 }}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/20 text-teal-400 flex items-center justify-center flex-shrink-0">
                  {s.icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{s.title}</p>
                  <p className="text-slate-400 text-sm mt-0.5">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-slate-500 text-sm">Free to join. No credit card required.</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background"
      >
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">SkillEngine</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Create your account</h1>
            <p className="text-muted-foreground">
              Join SkillEngine — choose your role to get started
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="flex bg-secondary/30 p-1.5 rounded-xl mb-4 border border-border/50">
              <button
                type="button"
                onClick={() => setRole("candidate")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  role === "candidate" ? "bg-background shadow-sm text-foreground border border-border/50" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <UserCircle className="w-4 h-4" />
                Candidate
              </button>
              <button
                type="button"
                onClick={() => setRole("recruiter")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  role === "recruiter" ? "bg-background shadow-sm text-foreground border border-border/50" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Users className="w-4 h-4" />
                Recruiter
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
              >
                <div className="w-4 h-4 mt-0.5 flex-shrink-0 rounded-full bg-destructive/20 flex items-center justify-center text-[10px] font-bold">!</div>
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full gap-2 mt-2"
              isLoading={loading}
              disabled={loading}
            >
              {!loading && <UserPlus className="w-4 h-4" />}
              Create {role === "candidate" ? "Candidate" : "Recruiter"} Account
            </Button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">Already have an account?</p>
            <Link href="/login">
              <button className="w-full h-11 rounded-lg border-2 border-input font-medium text-sm hover:border-primary hover:text-primary transition-all duration-200">
                Sign in instead
              </button>
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              Always free
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              100% anonymous
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
