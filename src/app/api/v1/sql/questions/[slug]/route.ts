import { NextResponse } from "next/server";
import { getSqlQuestionBySlug } from "@/lib/sql-practice";
import { getSubmissionsForQuestion } from "@/lib/sql-practice";
import { requireAuth } from "../../../require-auth";

type Params = Promise<{ slug: string }>;

export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  const [err, user] = await requireAuth(request);
  if (err) return err;
  const { slug } = await params;
  const question = await getSqlQuestionBySlug(slug);
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }
  const submissions = await getSubmissionsForQuestion(user!.id, question.id);
  const expectedResult = Array.isArray(question.expectedResult)
    ? question.expectedResult
    : [];
  return NextResponse.json({
    id: question.id,
    slug: question.slug,
    title: question.title,
    difficulty: question.difficulty,
    problemStatement: question.problemStatement,
    schemaSql: question.schemaSql,
    seedSql: question.seedSql,
    expectedResult,
    submissions: submissions.map((s) => ({
      id: s.id,
      submittedSql: s.submittedSql,
      passed: s.passed,
      aiFeedback: s.aiFeedback,
      createdAt: s.createdAt,
    })),
  });
}
