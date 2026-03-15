import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Layout } from "@/components/layout";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import CandidateDashboard from "@/pages/candidate-dashboard";
import TakeAssessment from "@/pages/take-assessment";
import CandidateResults from "@/pages/candidate-results";
import RecruiterDashboard from "@/pages/recruiter-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";
import { useAppStore, getUserRole } from "@/store/use-app-store";
import { supabase } from "@/lib/supabase";

const queryClient = new QueryClient();

function AuthGuard({ children }) {
  const { user, authLoading } = useAppStore();
  if (authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }
  if (!user) return <Redirect to="/login" />;
  return <>{children}</>;
}

function AppRouter() {
  const { user, candidateId, authLoading } = useAppStore();
  const role = getUserRole(user);

  if (authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (user && role === "admin") {
    return (
      <Layout>
        <Switch>
          <Route path="/" component={AdminDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/login" component={() => <Redirect to="/" />} />
          <Route path="/register" component={() => <Redirect to="/" />} />
          <Route component={AdminDashboard} />
        </Switch>
      </Layout>
    );
  }

  if (user && role === "recruiter") {
    return (
      <Layout>
        <Switch>
          <Route path="/" component={RecruiterDashboard} />
          <Route path="/recruiter" component={RecruiterDashboard} />
          <Route path="/login" component={() => <Redirect to="/" />} />
          <Route path="/register" component={() => <Redirect to="/" />} />
          <Route component={RecruiterDashboard} />
        </Switch>
      </Layout>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route
          path="/"
          component={() => (
            <AuthGuard>
              <Home />
            </AuthGuard>
          )}
        />
        <Route
          path="/dashboard"
          component={() => (
            <AuthGuard>
              <CandidateDashboard />
            </AuthGuard>
          )}
        />
        <Route
          path="/assessment/:id"
          component={() => (
            <AuthGuard>
              <TakeAssessment />
            </AuthGuard>
          )}
        />
        <Route
          path="/results"
          component={() => (
            <AuthGuard>
              <CandidateResults />
            </AuthGuard>
          )}
        />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function AuthListener() {
  const { setUser } = useAppStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthListener />
        <AppRouter />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
