"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { submitAnswerAndGetFeedback } from "../../actions";
import { Button } from "@/components/ui/Button";

type Step = {
  id: string;
  stepIndex: number;
  questionText: string;
  userAnswer: string | null;
  feedback: string | null;
};

type Props = {
  sessionId: string;
  steps: Step[];
  currentQuestionIndex: number;
  showFeedbackForStepIndex: number | null;
  isComplete: boolean;
};

export function MockInterviewSessionClient({
  sessionId,
  steps,
  currentQuestionIndex,
  showFeedbackForStepIndex,
  isComplete,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show completion summary when all steps are answered
  if (isComplete && currentQuestionIndex === -1) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Interview complete
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          You’ve answered all {steps.length} questions. Great practice!
        </p>
        <div className="flex gap-3">
          <Link href="/mock-interview">
            <Button variant="secondary">Back to Mock Interview</Button>
          </Link>
          <Link href="/mock-interview/new">
            <Button>Start another</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show feedback for a step (after submit) with Next or Finish
  if (showFeedbackForStepIndex != null && steps[showFeedbackForStepIndex]?.feedback) {
    const step = steps[showFeedbackForStepIndex];
    const isLast = showFeedbackForStepIndex === steps.length - 1;
    const nextIndex = showFeedbackForStepIndex + 1;
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Feedback
        </h2>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
          <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
            {step.feedback}
          </p>
        </div>
        {isLast ? (
          <Link href="/mock-interview">
            <Button>Finish</Button>
          </Link>
        ) : (
          <Link href={`/mock-interview/session/${sessionId}?step=${nextIndex}`}>
            <Button>Next question</Button>
          </Link>
        )}
      </div>
    );
  }

  // No more questions (shouldn't happen if not complete)
  if (currentQuestionIndex < 0 || currentQuestionIndex >= steps.length) {
    return (
      <div>
        <p className="text-neutral-600 dark:text-neutral-400">No more questions.</p>
        <Link href="/mock-interview" className="mt-4 inline-block">
          <Button variant="secondary">Back to Mock Interview</Button>
        </Link>
      </div>
    );
  }

  // Show current question and answer form
  const step = steps[currentQuestionIndex];
  const questionNumber = currentQuestionIndex + 1;

  function handleSkip() {
    setError(null);
    const next = currentQuestionIndex + 1;
    const url =
      next < steps.length
        ? `/mock-interview/session/${sessionId}?step=${next}`
        : "/mock-interview";

    router.push(url);
    router.refresh();
    if (typeof window !== "undefined") {
      window.location.assign(url);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const answer = (form.elements.namedItem("answer") as HTMLTextAreaElement)?.value?.trim() ?? "";
    const result = await submitAnswerAndGetFeedback(sessionId, step.id, answer);
    if (result.ok) {
      const url = `/mock-interview/session/${sessionId}?view=feedback&step=${currentQuestionIndex}`;
      router.push(url);
      router.refresh();
      if (typeof window !== "undefined") {
        window.location.assign(url);
      }
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Question {questionNumber} of {steps.length}
      </p>
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
        {step.questionText}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
          >
            {error}
          </div>
        )}
        <div>
          <label
            htmlFor="answer"
            className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Your answer
          </label>
          <textarea
            id="answer"
            name="answer"
            rows={6}
            required
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white"
            placeholder="Type your answer here…"
          />
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Submitting…" : "Submit and get feedback"}
          </Button>
          <Button type="button" variant="secondary" onClick={handleSkip} disabled={loading}>
            Skip question
          </Button>
        </div>
      </form>
    </div>
  );
}
