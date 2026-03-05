"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { submitSuggestionAction } from "@/app/sql-practice/actions";

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export function SuggestQuestionModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  function reset() {
    setTopic("");
    setDifficulty("medium");
    setDescription("");
    setResult(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await submitSuggestionAction(topic, difficulty, description);
      if (res.ok) {
        setResult({ ok: true });
        setTimeout(() => {
          reset();
          onClose();
        }, 1500);
      } else {
        setResult({ ok: false, error: res.error });
      }
    } catch {
      setResult({ ok: false, error: "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 m-auto w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-black/40 dark:border-neutral-700 dark:bg-neutral-900"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Suggest a Question
          </h2>
          <button
            type="button"
            onClick={() => { reset(); onClose(); }}
            className="rounded p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Have a great SQL question idea? Describe it below and we&#39;ll review it for inclusion.
        </p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sg-topic" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Topic / Title
          </label>
          <input
            id="sg-topic"
            type="text"
            required
            maxLength={200}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder='e.g. "Find users with duplicate emails"'
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Difficulty
          </label>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
                  difficulty === d
                    ? d === "easy"
                      ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-700"
                      : d === "medium"
                      ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-700"
                      : "bg-red-100 text-red-800 ring-1 ring-red-300 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-700"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sg-desc" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Description
          </label>
          <textarea
            id="sg-desc"
            required
            maxLength={2000}
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the problem, what tables/columns are involved, and what the expected output should look like. The more detail, the better!"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
          />
          <span className="text-right text-xs text-neutral-400">
            {description.length}/2000
          </span>
        </div>

        {result && (
          <p className={`text-sm font-medium ${result.ok ? "text-emerald-600" : "text-red-600"}`}>
            {result.ok ? "Thanks! Your suggestion has been submitted." : result.error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => { reset(); onClose(); }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !topic.trim() || !description.trim()}>
            {submitting ? "Submitting…" : "Submit Suggestion"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
