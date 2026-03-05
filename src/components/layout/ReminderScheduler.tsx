"use client";

import { useEffect } from "react";

export function ReminderScheduler({
  enabled,
  time,
}: {
  enabled: boolean;
  time: string | null;
}) {
  useEffect(() => {
    if (!enabled || !time || typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    const [hours, minutes] = time.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return;

    function scheduleNext() {
      const now = new Date();
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);

      if (target <= now) {
        target.setDate(target.getDate() + 1);
      }

      const ms = target.getTime() - now.getTime();
      return setTimeout(() => {
        new Notification("Time to study!", {
          body: "Keep your streak going — open The Offer Lab and complete a session.",
          icon: "/favicon.ico",
        });
      }, ms);
    }

    const timer = scheduleNext();
    return () => clearTimeout(timer);
  }, [enabled, time]);

  return null;
}
