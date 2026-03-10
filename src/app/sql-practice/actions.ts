"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { checkAndUnlockAchievements } from "@/lib/achievements";

// ── Suggestion box ───────────────────────────────────────────────────

export type SubmitSuggestionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitSuggestionAction(
  topic: string,
  difficulty: string,
  description: string,
): Promise<SubmitSuggestionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  const trimTopic = topic.trim();
  const trimDesc = description.trim();
  if (!trimTopic || !trimDesc) {
    return { ok: false, error: "Topic and description are required." };
  }
  if (trimDesc.length > 2000) {
    return { ok: false, error: "Description must be under 2000 characters." };
  }
  await prisma.sqlSuggestion.create({
    data: {
      userId: session.user.id,
      topic: trimTopic,
      difficulty,
      description: trimDesc,
    },
  });
  return { ok: true };
}

export async function getUserSuggestions() {
  const session = await auth();
  if (!session?.user?.id) return [];
  return prisma.sqlSuggestion.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

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
  if (passed) {
    await checkAndUnlockAchievements(session.user.id).catch(() => {});
  }
  return { ok: true, attemptId: attempt.id };
}

export type RequestFeedbackResult =
  | { ok: true; feedback: string }
  | { ok: false; error: string };

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error: ${res.status} ${err.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "No feedback generated.";
}

async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
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
    throw new Error(`OpenAI error: ${res.status} ${err.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "No feedback generated.";
}

export async function requestSqlFeedbackAction(
  attemptId: string
): Promise<RequestFeedbackResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Not signed in" };
  }
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!geminiKey && !openaiKey) {
    return {
      ok: false,
      error: "AI feedback requires an API key. Add GEMINI_API_KEY (free) or OPENAI_API_KEY to your .env file.",
    };
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
    const feedback = geminiKey
      ? await callGemini(prompt, geminiKey)
      : await callOpenAI(prompt, openaiKey!);
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
