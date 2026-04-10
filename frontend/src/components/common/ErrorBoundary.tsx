import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Uncaught error in ${this.props.name || 'Component'}:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-toi-card rounded-xl border border-toi-red/20 shadow-lg animate-fade-in mx-auto my-4 max-w-md text-center">
          <div className="p-3 bg-toi-red/10 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-toi-red" />
          </div>
          <h2 className="text-sm font-bold text-toi-text mb-2">
            Something went wrong
          </h2>
          <p className="text-xs text-toi-text-muted mb-6 leading-relaxed">
            {this.state.error?.message || 'An unexpected error occurred in this section.'}
          </p>
          <button 
            onClick={this.handleReset}
            className="btn-ghost text-xs flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
