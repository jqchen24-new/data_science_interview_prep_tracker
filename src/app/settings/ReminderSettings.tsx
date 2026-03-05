"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { updateReminderAction } from "./actions";

export function ReminderSettings({
  initialEnabled,
  initialTime,
}: {
  initialEnabled: boolean;
  initialTime: string;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [time, setTime] = useState(initialTime);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<NotificationPermission | "unsupported">(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  async function requestPermission() {
    if (typeof Notification === "undefined") {
      setPermissionState("unsupported");
      return;
    }
    const result = await Notification.requestPermission();
    setPermissionState(result);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (enabled && permissionState !== "granted") {
      await requestPermission();
      if (Notification.permission !== "granted") {
        setMessage("Browser notification permission is required. Please allow notifications and try again.");
        setSaving(false);
        return;
      }
    }

    const formData = new FormData();
    if (enabled) formData.set("reminderEnabled", "on");
    formData.set("reminderTime", time);

    const result = await updateReminderAction(formData);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage(enabled ? "Reminder saved!" : "Reminder disabled.");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500 dark:border-neutral-600 dark:bg-neutral-800"
        />
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Enable daily study reminder
        </span>
      </label>

      {enabled && (
        <div className="flex items-center gap-3">
          <label htmlFor="reminder-time" className="text-sm text-neutral-600 dark:text-neutral-400">
            Remind me at:
          </label>
          <input
            id="reminder-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
          />
        </div>
      )}

      {enabled && permissionState === "denied" && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Notifications are blocked by your browser. Please update your browser settings to allow notifications for this site.
        </p>
      )}

      {enabled && permissionState === "unsupported" && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Your browser does not support notifications.
        </p>
      )}

      {message && (
        <p className={`text-sm font-medium ${message.includes("saved") || message.includes("disabled") ? "text-emerald-600" : "text-red-600"}`}>
          {message}
        </p>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
