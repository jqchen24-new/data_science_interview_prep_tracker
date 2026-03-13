import { NextResponse } from "next/server";
import { getSqlQuestions } from "@/lib/sql-practice";
import { requireAuth } from "../../require-auth";

export async function GET(request: Request) {
  const [err] = await requireAuth(request);
  if (err) return err;

  const questions = await getSqlQuestions();
  return NextResponse.json(
    questions.map((q) => ({
      id: q.id,
      slug: q.slug,
      title: q.title,
      difficulty: q.difficulty,
    }))
  );
}
