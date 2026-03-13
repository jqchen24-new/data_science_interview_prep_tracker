"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { parseResumeFile } from "@/lib/resume-parser";
import { generateQuestionsFromResume, getFeedbackForAnswer } from "@/lib/mock-interview-openai";

const QUESTION_COUNT = 8;

export type CreateSessionResult =
  | { ok: true; sessionId: string }
  | { ok: false; error: string };

export async function createSessionFromResume(formData: FormData): Promise<CreateSessionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const file = formData.get("resume") as File | null;
  if (!file || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Please select a resume file (PDF, DOCX, or TXT)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "";
  const fileName = file.name || "resume";

  const parseResult = await parseResumeFile(buffer, mimeType, fileName);
  if (!parseResult.ok) {
    console.error("Mock interview: resume parse failed", parseResult.error);
    return { ok: false, error: parseResult.error };
  }
  const resumeText = parseResult.text;

  let questions: string[];
  try {
    questions = await generateQuestionsFromResume(resumeText, QUESTION_COUNT);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to generate questions.";
    console.error("Mock interview: question generation failed", e);
    return { ok: false, error: message };
  }

  if (questions.length === 0) {
    return { ok: false, error: "Could not generate any questions. Try again or use a different resume." };
  }

  const dbSession = await prisma.mockInterviewSession.create({
    data: {
      userId: session.user.id,
      resumeText,
      fileName,
      status: "in_progress",
      steps: {
        create: questions.map((q, i) => ({
          stepIndex: i,
          questionText: q,
        })),
      },
    },
  });

  return { ok: true, sessionId: dbSession.id };
}

export type SubmitAnswerResult =
  | { ok: true; feedback: string }
  | { ok: false; error: string };

export async function submitAnswerAndGetFeedback(
  sessionId: string,
  stepId: string,
  userAnswer: string
): Promise<SubmitAnswerResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const trimmed = userAnswer?.trim() ?? "";
  if (!trimmed) return { ok: false, error: "Please enter your answer." };

  const step = await prisma.mockInterviewStep.findFirst({
    where: { id: stepId, session: { userId: session.user.id } },
    include: { session: true },
  });
  if (!step) return { ok: false, error: "Question not found." };

  let feedback: string;
  try {
    feedback = await getFeedbackForAnswer(step.questionText, trimmed);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to get feedback.";
    return { ok: false, error: message };
  }

  const answeredAt = new Date();
  await prisma.mockInterviewStep.update({
    where: { id: stepId },
    data: { userAnswer: trimmed, feedback, answeredAt },
  });

  const allSteps = await prisma.mockInterviewStep.findMany({
    where: { sessionId },
    orderBy: { stepIndex: "asc" },
  });
  const allAnswered = allSteps.every((s) => s.userAnswer != null);
  if (allAnswered) {
    await prisma.mockInterviewSession.update({
      where: { id: sessionId },
      data: { status: "completed" },
    });
  }

  return { ok: true, feedback };
}
