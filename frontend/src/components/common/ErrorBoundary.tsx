import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    // Avoid console.error spam in production logs
    // but keep useful for dev
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn("Route error:", err, info);
    }
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--destructive))" strokeWidth="2">
                <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold font-display">Something went wrong</h2>
            <button
              onClick={this.reset}
              className="mt-4 px-4 py-2 rounded-button bg-primary text-primary-foreground text-sm font-medium"
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
