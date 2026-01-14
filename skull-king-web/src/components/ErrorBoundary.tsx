import { Component, ErrorInfo, ReactNode } from "react";
import "./ErrorBoundary.scss";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="ErrorBoundary">
          <div className="ErrorBoundary-content">
            <h2 className="ErrorBoundary-title">Something went wrong</h2>
            <p className="ErrorBoundary-message">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button className="ErrorBoundary-button" onClick={this.handleRetry}>
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
