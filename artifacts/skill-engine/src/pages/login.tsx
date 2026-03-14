import { useState } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { AnimatedPage, Button, Card, CardContent, Input, Label } from "@/components/ui-elements";
import { ShieldCheck, LogIn, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const [_, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setLocation("/");
    }
  };

  return (
    <AnimatedPage className="flex-grow flex items-center justify-center p-4 min-h-[80vh]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-accent text-white shadow-lg shadow-primary/30 mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-display font-bold">Welcome back</h1>
          <p className="text-muted-foreground mt-2">Sign in to your SkillEngine account</p>
        </div>

        <Card className="border shadow-xl">
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
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

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                >
                  {error}
                </motion.div>
              )}

              <Button type="submit" size="lg" className="w-full gap-2" isLoading={loading} disabled={loading}>
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Create one
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AnimatedPage>
  );
}
