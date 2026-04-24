import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw, RotateCcw, ChevronRight } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onReset?.();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 text-center bg-zinc-900 border-2 border-destructive/20 rounded-2xl shadow-[0_8px_0_0_#09090b]">
          <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          
          <h2 className="text-lg font-black mb-1 tracking-tight">
            {this.props.componentName ? `${this.props.componentName} Error` : 'Something went wrong'}
          </h2>
          
          <p className="text-muted-foreground mb-4 text-xs max-w-xs mx-auto">
            {this.state.error?.message || 'An unexpected error occurred while rendering this component.'}
          </p>

          {this.state.error?.message && (
            <div className="w-full max-w-xs mb-4 p-2 bg-destructive/5 rounded text-left overflow-auto">
              <code className="text-[10px] text-destructive font-mono">
                {this.state.error.message}
              </code>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={this.handleReset}
              className="h-9 px-4 text-xs font-bold flex items-center gap-1"
            >
              <RotateCcw size={14} />
              Try Again
            </Button>
            
            <Button 
              onClick={this.handleReload}
              className="h-9 px-4 text-xs font-bold bg-primary hover:bg-primary/90 flex items-center gap-1"
            >
              <RefreshCw size={14} />
              Reload
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundaries for major components
export function ChessboardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary 
      componentName="Chessboard"
      fallback={
        <div className="flex items-center justify-center h-[500px] bg-zinc-900 border-2 border-zinc-800 rounded-lg">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-3" />
            <p className="text-sm font-bold">Chessboard failed to load</p>
            <p className="text-xs text-muted-foreground">Try refreshing the page</p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function AnalysisErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary 
      componentName="Analysis Panel"
      onReset={() => {
        // Reset analysis state
        console.log('Resetting analysis...');
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export function GameHistoryErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary 
      componentName="Game History"
      onReset={() => {
        // Clear history cache
        console.log('Resetting history...');
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

