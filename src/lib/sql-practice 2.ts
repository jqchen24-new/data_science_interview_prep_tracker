import { prisma } from "./db";

export async function getSqlQuestions() {
  return prisma.sqlQuestion.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      difficulty: true,
    },
  });
}

export async function getSqlQuestionBySlug(slug: string) {
  return prisma.sqlQuestion.findUnique({
    where: { slug },
  });
}

export async function getSqlQuestionIdsBySlug() {
  const rows = await prisma.sqlQuestion.findMany({
    select: { slug: true, id: true },
  });
  return new Map(rows.map((r) => [r.slug, r.id]));
}

/** Get passed attempt counts per question for a user (for "solved" badges). */
export async function getSqlAttemptPassedByQuestion(userId: string) {
  const passed = await prisma.sqlAttempt.findMany({
    where: { userId, passed: true },
    select: { questionId: true },
    distinct: ["questionId"],
  });
  return new Set(passed.map((p) => p.questionId));
}

/**
 * Normalize rows for comparison: sort keys and stringify so order of columns
 * and row order don't matter. Returns a sorted array of canonical row strings.
 */
function normalizeRows(rows: Record<string, unknown>[]): string[] {
  return rows
    .map((row) => {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(row).sort()) {
        sorted[k] = row[k];
      }
      return JSON.stringify(sorted);
    })
    .sort();
}

/**
 * Compare actual query result to expected result. Both are arrays of row objects.
 * Column order and row order are normalized before comparison.
 */
export function compareSqlResult(
  actualRows: Record<string, unknown>[],
  expectedRows: Record<string, unknown>[]
): { passed: boolean; message?: string } {
  const a = normalizeRows(actualRows);
  const b = normalizeRows(expectedRows);
  if (a.length !== b.length) {
    return {
      passed: false,
      message: `Expected ${b.length} row(s), got ${a.length}`,
    };
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return {
        passed: false,
        message: "Result rows don't match expected output.",
      };
    }
  }
  return { passed: true };
}
