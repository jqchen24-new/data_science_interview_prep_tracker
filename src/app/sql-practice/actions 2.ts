"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export type SubmitAttemptResult =
  | { ok: true; attemptId: string }
  | { ok: false; error: string };

export async function submitAttemptAction(
  questionId: string,
  submittedSql: string,
  passed: boolean,
  runResult?: Record<string, unknown>[]
): Promise<SubmitAttemptResult> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  const question = await prisma.sqlQuestion.findUnique({
    where: { id: questionId },
  });
  if (!question) {
    return { ok: false, error: "Question not found" };
  }
  const attempt = await prisma.sqlAttempt.create({
    data: {
      userId: session.user.id,
      questionId,
      submittedSql: submittedSql.trim(),
      passed,
      runResult: runResult != null ? (runResult as Prisma.InputJsonValue) : undefined,
    },
  });
  return { ok: true, attemptId: attempt.id };
}

export type RequestFeedbackResult =
  | { ok: true; feedback: string }
  | { ok: false; error: string };

export async function requestSqlFeedbackAction(
  attemptId: string
): Promise<RequestFeedbackResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Not signed in" };
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "AI feedback is not configured" };
  }
  const attempt = await prisma.sqlAttempt.findFirst({
    where: { id: attemptId, userId: session.user.id },
    include: { question: true },
  });
  if (!attempt) {
    return { ok: false, error: "Attempt not found" };
  }
  const prompt = `You are an expert SQL interviewer. Give brief, constructive feedback on this candidate's SQL solution.

**Problem:** ${attempt.question.title}
${attempt.question.problemStatement.slice(0, 800)}

**Candidate's solution:**
\`\`\`sql
${attempt.submittedSql}
\`\`\`

**Result:** ${attempt.passed ? "Correct" : "Incorrect"}

Provide 2-4 short sentences on: correctness (if wrong, what might be off), style (readability, naming), and efficiency (indexes, approach) where relevant. Be encouraging but specific.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, error: `OpenAI error: ${res.status} ${err.slice(0, 100)}` };
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const feedback =
      data.choices?.[0]?.message?.content?.trim() ?? "No feedback generated.";
    await prisma.sqlAttempt.update({
      where: { id: attemptId },
      data: { aiFeedback: feedback },
    });
    return { ok: true, feedback };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}
