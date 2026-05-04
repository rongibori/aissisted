"use client";

import { useEffect } from "react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.error("[route-error]", error);
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <p className="text-xs uppercase tracking-widest text-muted mb-3">
          Something&rsquo;s off
        </p>
        <h1 className="text-2xl font-semibold text-ink mb-3">
          We hit a snag.
        </h1>
        <p className="text-sm text-muted mb-6 leading-relaxed">
          Try again in a moment. If it keeps happening, refresh the page.
        </p>
        <button
          onClick={reset}
          className="text-sm font-medium text-ink underline underline-offset-4 hover:text-brand transition-colors"
        >
          Try again
        </button>
        {error.digest && (
          <p className="mt-8 text-[10px] uppercase tracking-widest text-soft font-system">
            Ref · {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
