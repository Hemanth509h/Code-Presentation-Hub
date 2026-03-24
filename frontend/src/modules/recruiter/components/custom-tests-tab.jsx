import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, Button } from "@/shared/components/ui-elements";
import { Plus, ClipboardList } from "lucide-react";
import { CreateTestPanel } from "./create-test-panel";
import { TestCard } from "./test-card";

export function CustomTestsTab() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/custom-tests", { credentials: "include" });
      if (res.ok) setTests(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">My Custom Tests</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Create tests and assign them directly to candidates</p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Create Test
          </Button>
        )}
      </div>

      {creating && (
        <CreateTestPanel
          onCreated={() => { setCreating(false); fetchTests(); }}
          onCancel={() => setCreating(false)}
        />
      )}

      {tests.length === 0 && !creating ? (
        <Card className="border-dashed bg-secondary/30">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <ClipboardList className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No custom tests yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Create a custom test with your own questions and assign it to specific candidates.
            </p>
            <Button onClick={() => setCreating(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Create Your First Test
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => (
            <TestCard
              key={test.customTestId}
              test={test}
              onRefresh={fetchTests}
              onDelete={fetchTests}
            />
          ))}
        </div>
      )}
    </div>
  );
}
