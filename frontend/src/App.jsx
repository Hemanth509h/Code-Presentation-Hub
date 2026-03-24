import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Layout } from "@/shared/layout/layout";
import Home from "@/modules/home/home";
import Login from "@/modules/auth/login";
import Register from "@/modules/auth/register";
import CandidateDashboard from "@/modules/candidate/candidate-dashboard";
import TakeAssessment from "@/modules/candidate/take-assessment";
import TakeCustomTest from "@/modules/candidate/take-custom-test";
import CandidateResults from "@/modules/candidate/candidate-results";
import RecruiterDashboard from "@/modules/recruiter/recruiter-dashboard";
import AdminDashboard from "@/modules/admin/admin-dashboard";
import FairnessDashboard from "@/modules/admin/fairness-dashboard";
import NotFound from "@/modules/common/not-found";
import { useAppStore, getUserRole } from "@/store/use-app-store";

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
          <Route path="/fairness" component={FairnessDashboard} />
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
          <Route path="/fairness" component={FairnessDashboard} />
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
          path="/custom-test/:testId"
          component={() => (
            <AuthGuard>
              <TakeCustomTest />
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
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((user) => setUser(user))
      .catch(() => setUser(null));
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
