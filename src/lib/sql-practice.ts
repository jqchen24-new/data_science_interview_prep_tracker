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

export async function getAdjacentQuestionSlugs(currentOrder: number) {
  const [prev, next] = await Promise.all([
    prisma.sqlQuestion.findFirst({
      where: { order: { lt: currentOrder } },
      orderBy: { order: "desc" },
      select: { slug: true },
    }),
    prisma.sqlQuestion.findFirst({
      where: { order: { gt: currentOrder } },
      orderBy: { order: "asc" },
      select: { slug: true },
    }),
  ]);
  return { prevSlug: prev?.slug ?? null, nextSlug: next?.slug ?? null };
}

export async function getSqlQuestionIdsBySlug() {
  const rows = await prisma.sqlQuestion.findMany({
    select: { slug: true, id: true },
  });
  return new Map(rows.map((r) => [r.slug, r.id]));
}

/** Get all submissions for a question by a user, newest first. */
export async function getSubmissionsForQuestion(userId: string, questionId: string) {
  const attempts = await prisma.sqlAttempt.findMany({
    where: { userId, questionId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      submittedSql: true,
      passed: true,
      aiFeedback: true,
      createdAt: true,
    },
  });
  return attempts.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));
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
function coerceValue(v: unknown): string | number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (trimmed === "") return trimmed;
    const n = Number(trimmed);
    if (!Number.isNaN(n) && String(n) === trimmed) return n;
    return trimmed.toLowerCase();
  }
  return String(v).toLowerCase();
}

function normalizeRows(rows: Record<string, unknown>[]): string[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      if (row === null || typeof row !== "object") return "{}";
      const sorted: Record<string, string | number | null> = {};
      for (const k of Object.keys(row).sort()) {
        sorted[k.toLowerCase()] = coerceValue(row[k]);
      }
      return JSON.stringify(sorted);
    })
    .sort();
}

/** Compare rows by sorted values only (ignoring column names). */
function normalizeRowsValuesOnly(rows: Record<string, unknown>[]): string[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      if (row === null || typeof row !== "object") return "[]";
      const vals = Object.values(row).map(coerceValue);
      vals.sort((a, b) => JSON.stringify(a ?? "").localeCompare(JSON.stringify(b ?? "")));
      return JSON.stringify(vals);
    })
    .sort();
}

function arraysMatch(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Compare actual query result to expected result. Both are arrays of row objects.
 * Column order and row order are normalized before comparison.
 * Falls back to value-only comparison when column names differ (e.g. generic columns).
 */
export function compareSqlResult(
  actualRows: Record<string, unknown>[],
  expectedRows: Record<string, unknown>[]
): { passed: boolean; message?: string } {
  const actual = Array.isArray(actualRows) ? actualRows : [];
  const expected = Array.isArray(expectedRows) ? expectedRows : [];

  if (actual.length !== expected.length) {
    return {
      passed: false,
      message: `Expected ${expected.length} row(s), got ${actual.length}`,
    };
  }

  const a = normalizeRows(actual);
  const b = normalizeRows(expected);
  if (arraysMatch(a, b)) return { passed: true };

  const aVals = normalizeRowsValuesOnly(actual);
  const bVals = normalizeRowsValuesOnly(expected);
  if (arraysMatch(aVals, bVals)) return { passed: true };

  return {
    passed: false,
    message: "Result rows don't match expected output.",
  };
}
