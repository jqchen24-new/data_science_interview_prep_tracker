"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export function PostOnboardingBanner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);
  const show = searchParams.get("onboarding") === "1" && !dismissed;

  function handleDismiss() {
    setDismissed(true);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("onboarding");
    const query = next.toString();
    router.replace(query ? `/dashboard?${query}` : "/dashboard", {
      scroll: false,
    });
  }

  if (!show) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/50 dark:bg-emerald-950/30">
      <p className="text-sm text-emerald-800 dark:text-emerald-200">
        <span className="font-medium">You’re all set.</span> Customize your
        tags or jump into your first session.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/tags"
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
        >
          Customize tags
        </Link>
        <Link
          href="/plan"
          className="rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
        >
          Plan your day
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded p-1 text-emerald-600/70 hover:text-emerald-800 dark:text-emerald-400/70 dark:hover:text-emerald-200"
          aria-label="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
