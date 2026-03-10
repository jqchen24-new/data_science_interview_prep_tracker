"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SUCCESS_MESSAGES } from "@/lib/success-messages";

const AUTO_HIDE_MS = 3500;

export function SuccessBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const success = searchParams.get("success");
  const message = success ? SUCCESS_MESSAGES[success] ?? "Done" : null;

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }
    setVisible(true);
    router.refresh();
    const timer = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      next.delete("success");
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      setVisible(false);
    }, AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [message, pathname, router, searchParams]);

  if (!visible || !message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200"
    >
      {message}
    </div>
  );
}
