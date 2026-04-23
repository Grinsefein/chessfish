import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
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
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-card border border-destructive/20 rounded-2xl shadow-2xl">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-black mb-2 tracking-tighter">Something went wrong</h2>
          <p className="text-muted-foreground mb-8 text-sm max-w-xs mx-auto">
            {this.state.error?.message || 'An unexpected error occurred while rendering this component.'}
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="h-12 px-8 font-bold rounded-xl bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
          >
            <RefreshCw size={18} />
            REFRESH APP
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
