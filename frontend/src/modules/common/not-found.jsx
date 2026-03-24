import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button, Card, CardContent } from "@/shared/components/ui-elements";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4 shadow-xl">
        <CardContent className="pt-10 pb-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            404 — Page Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            The page you are looking for does not exist.
          </p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
