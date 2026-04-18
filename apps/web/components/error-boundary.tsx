"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] px-6 text-center">
          <p className="text-lg font-semibold text-ink mb-2">
            Something&rsquo;s off
          </p>
          <p className="text-sm text-muted mb-6 max-w-sm">
            {this.state.error?.message ?? "We hit a snag. Try again in a moment."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-sm text-ink underline hover:text-brand transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
