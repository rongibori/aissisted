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
          <p className="text-lg font-semibold text-[#e8e8f0] mb-2">
            Something went wrong
          </p>
          <p className="text-sm text-[#7a7a98] mb-6 max-w-sm">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-sm text-indigo-400 hover:text-indigo-300 underline"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
