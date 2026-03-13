"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSessionFromResume } from "../actions";

const ALLOWED_EXTENSIONS = ".pdf, .docx, .txt";

export function MockInterviewUploadForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      const result = await createSessionFromResume(formData);
      // Log for debugging in browser devtools
      console.log("createSessionFromResume result", result);
      if (result && "ok" in result && result.ok) {
        router.push(`/mock-interview/session/${result.sessionId}`);
        router.refresh();
      } else if (result && "error" in result) {
        setError(result.error || "Something went wrong. Please try again.");
      } else {
        setError("Unexpected response from server. Please try again.");
      }
    } catch (err) {
      console.error("createSessionFromResume threw", err);
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800"
    >
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
        >
          {error}
        </div>
      )}
      <div>
        <label
          htmlFor="resume"
          className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Resume file
        </label>
        <input
          id="resume"
          name="resume"
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          required
          className="w-full text-sm text-neutral-900 file:mr-4 file:rounded-lg file:border-0 file:bg-neutral-200 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-900 hover:file:bg-neutral-300 dark:file:bg-neutral-600 dark:file:text-white dark:hover:file:bg-neutral-500"
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {ALLOWED_EXTENSIONS}, max 5MB
        </p>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {loading ? "Creating session…" : "Start interview"}
      </button>
    </form>
  );
}
