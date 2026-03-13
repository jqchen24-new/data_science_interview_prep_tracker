import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { MockInterviewSessionClient } from "./MockInterviewSessionClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string; step?: string }> };

export default async function MockInterviewSessionPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { id } = await params;
  const { view, step: stepParam } = await searchParams;

  const interviewSession = await prisma.mockInterviewSession.findFirst({
    where: { id, userId: session.user.id },
    include: {
      steps: { orderBy: { stepIndex: "asc" } },
    },
  });

  if (!interviewSession) notFound();

  const steps = interviewSession.steps;
  const currentQuestionIndex = steps.findIndex((s) => s.userAnswer == null);
  const feedbackStepIndex = view === "feedback" && stepParam != null ? parseInt(stepParam, 10) : null;
  const showFeedback =
    feedbackStepIndex != null &&
    !Number.isNaN(feedbackStepIndex) &&
    feedbackStepIndex >= 0 &&
    feedbackStepIndex < steps.length &&
    steps[feedbackStepIndex].feedback != null;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <Link
        href="/mock-interview"
        className="text-sm font-medium text-neutral-600 underline dark:text-neutral-400 dark:hover:text-white"
      >
        Back to Mock Interview
      </Link>

      <MockInterviewSessionClient
        sessionId={id}
        steps={steps}
        currentQuestionIndex={currentQuestionIndex}
        showFeedbackForStepIndex={showFeedback ? feedbackStepIndex! : null}
        isComplete={interviewSession.status === "completed"}
      />
    </div>
  );
}
