import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSqlQuestionBySlug } from "@/lib/sql-practice";
import { compareSqlResult } from "@/lib/sql-practice";
import { runSqlServer } from "@/lib/sql-runner-server";
import { checkAndUnlockAchievements } from "@/lib/achievements";
import { requireAuth } from "../../require-auth";

export async function POST(request: Request) {
  const [err, user] = await requireAuth(request);
  if (err) return err;

  const body = await request.json().catch(() => ({}));
  const questionId = typeof body.questionId === "string" ? body.questionId.trim() : "";
  const submittedSql = typeof body.submittedSql === "string" ? body.submittedSql.trim() : "";

  if (!questionId || !submittedSql) {
    return NextResponse.json(
      { error: "questionId and submittedSql are required" },
      { status: 400 }
    );
  }

  const question = await prisma.sqlQuestion.findUnique({
    where: { id: questionId },
  });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const run = await runSqlServer(
    question.schemaSql,
    question.seedSql,
    submittedSql
  );

  if (!run.ok) {
    return NextResponse.json({
      passed: false,
      error: run.error,
    });
  }

  const expectedRows = (Array.isArray(question.expectedResult)
    ? question.expectedResult
    : []) as Record<string, unknown>[];
  const { passed, message } = compareSqlResult(run.rows, expectedRows);

  const attempt = await prisma.sqlAttempt.create({
    data: {
      userId: user!.id,
      questionId,
      submittedSql,
      passed,
      runResult: run.rows as Prisma.InputJsonValue,
    },
  });

  if (passed) {
    await checkAndUnlockAchievements(user!.id).catch(() => {});
  }

  return NextResponse.json({
    passed,
    attemptId: attempt.id,
    message: message ?? undefined,
    runResult: run.rows,
  });
}
