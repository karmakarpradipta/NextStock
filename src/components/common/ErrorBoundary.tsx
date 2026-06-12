import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-12 text-center animate-in fade-in zoom-in duration-500">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 ring-8 ring-destructive/5">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Something went wrong</h2>
          <p className="mb-8 max-w-[400px] text-sm text-muted-foreground font-medium leading-relaxed">
            The application encountered an unexpected error. Don't worry, your data is safe. You can try refreshing the page or going back to the dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button
              onClick={() => window.location.reload()}
              className="min-w-[140px] rounded-full font-bold shadow-lg shadow-primary/20"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/dashboard")}
              className="min-w-[140px] rounded-full font-bold border-border"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
          {import.meta.env.DEV && (
            <div className="mt-10 w-full max-w-2xl overflow-auto rounded-md bg-zinc-950 p-6 text-left font-mono text-xs text-zinc-400">
              <p className="mb-2 font-bold text-destructive">Error Details (Dev Only):</p>
              <pre className="whitespace-pre-wrap">{this.state.error?.toString()}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
