"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { compareSqlResult } from "@/lib/sql-practice";
import { submitAttemptAction, requestSqlFeedbackAction } from "@/app/sql-practice/actions";
import { Button } from "@/components/ui/Button";

type TableSchema = { tableName: string; columns: { name: string; type?: string }[] };

function parseSchema(schemaSql: string): TableSchema[] {
  const tables: TableSchema[] = [];
  const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?\s*\(([\s\S]*?)\)\s*;?/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(schemaSql)) !== null) {
    const tableName = m[1];
    const body = m[2];
    const columns: { name: string; type?: string }[] = [];
    const parts = body.split(",").map((s) => s.trim());
    for (const part of parts) {
      const constraintStart = /^(CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK)\b/i.test(part);
      if (constraintStart) continue;
      const colMatch = part.match(/^["']?(\w+)["']?\s*(.*)$/);
      if (colMatch) {
        columns.push({
          name: colMatch[1],
          type: colMatch[2].trim() || undefined,
        });
      }
    }
    tables.push({ tableName, columns });
  }
  return tables;
}

/** sql.js may return columns as array-like (e.g. from WASM); normalize to string[]. */
function normalizeColumnNames(cols: unknown): string[] {
  if (Array.isArray(cols)) return cols.map((c) => String(c));
  if (cols != null && typeof cols === "object" && "length" in cols) {
    const len = Number((cols as { length: number }).length);
    if (Number.isInteger(len) && len >= 0) {
      return Array.from({ length: len }, (_, i) => String((cols as Record<number, unknown>)[i]));
    }
  }
  return [];
}

/** sql.js may return row values as array-like; normalize to array. */
function normalizeRowValues(row: unknown): unknown[] {
  if (Array.isArray(row)) return row;
  if (row != null && typeof row === "object" && "length" in row) {
    const len = Number((row as { length: number }).length);
    if (Number.isInteger(len) && len >= 0) {
      return Array.from({ length: len }, (_, i) => (row as Record<number, unknown>)[i]);
    }
  }
  return [];
}

type Submission = {
  id: string;
  submittedSql: string;
  passed: boolean;
  aiFeedback: string | null;
  createdAt: string;
};

type SqlPracticeEditorProps = {
  questionId: string;
  title: string;
  difficulty?: string;
  problemStatement: string;
  schemaSql: string;
  seedSql: string;
  expectedResult: Record<string, unknown>[];
  submissions?: Submission[];
  prevSlug?: string | null;
  nextSlug?: string | null;
};

const LEFT_TABS = ["Description", "Submissions"] as const;
type LeftTab = (typeof LEFT_TABS)[number];

type ResultTab = "testcase" | "result";

/**
 * Rewrite MySQL-specific syntax that SQLite / sql.js can't parse natively.
 * - TIMESTAMPDIFF(UNIT, d1, d2) → _TSDIFF_UNIT(d1, d2)
 * - DATE_ADD(d, INTERVAL n UNIT)  → _DATE_ADD_UNIT(d, n)
 * - DATE_SUB(d, INTERVAL n UNIT)  → _DATE_SUB_UNIT(d, n)
 * - DATE_FORMAT(d, fmt)           → _DATE_FORMAT(d, fmt) (registered separately)
 * - IFNULL(a, b) is natively supported by SQLite, but alias just in case.
 */
function rewriteMySqlSyntax(query: string): string {
  let q = query;

  q = q.replace(
    /TIMESTAMPDIFF\s*\(\s*(YEAR|MONTH|DAY|HOUR|MINUTE|SECOND)\s*,/gi,
    (_match, unit: string) => `_TSDIFF_${unit.toUpperCase()}(`,
  );

  q = q.replace(
    /DATE_ADD\s*\(\s*([^,]+?)\s*,\s*INTERVAL\s+(.+?)\s+(YEAR|MONTH|DAY|HOUR|MINUTE|SECOND)\s*\)/gi,
    (_match, dateExpr: string, amount: string, unit: string) =>
      `_DATE_ADD_${unit.toUpperCase()}(${dateExpr}, ${amount})`,
  );

  q = q.replace(
    /DATE_SUB\s*\(\s*([^,]+?)\s*,\s*INTERVAL\s+(.+?)\s+(YEAR|MONTH|DAY|HOUR|MINUTE|SECOND)\s*\)/gi,
    (_match, dateExpr: string, amount: string, unit: string) =>
      `_DATE_SUB_${unit.toUpperCase()}(${dateExpr}, ${amount})`,
  );

  q = q.replace(/DATE_FORMAT\s*\(/gi, "_DATE_FORMAT(");

  return q;
}

function _dateParse(d: unknown): Date | null {
  const dt = new Date(String(d));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Register MySQL-compatible functions so users can write MySQL syntax. */
function registerMySqlCompat(db: { create_function: (name: string, fn: (...args: unknown[]) => unknown) => void }) {
  db.create_function("DATEDIFF", (d1: unknown, d2: unknown) => {
    const a = new Date(String(d1)).getTime();
    const b = new Date(String(d2)).getTime();
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    return Math.round((a - b) / 86400000);
  });

  db.create_function("_TSDIFF_DAY", (d1: unknown, d2: unknown) => {
    const a = new Date(String(d1)).getTime();
    const b = new Date(String(d2)).getTime();
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    return Math.round((b - a) / 86400000);
  });
  db.create_function("_TSDIFF_MONTH", (d1: unknown, d2: unknown) => {
    const a = _dateParse(d1);
    const b = _dateParse(d2);
    if (!a || !b) return null;
    return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  });
  db.create_function("_TSDIFF_YEAR", (d1: unknown, d2: unknown) => {
    const a = _dateParse(d1);
    const b = _dateParse(d2);
    if (!a || !b) return null;
    return b.getFullYear() - a.getFullYear();
  });
  db.create_function("_TSDIFF_HOUR", (d1: unknown, d2: unknown) => {
    const a = new Date(String(d1)).getTime();
    const b = new Date(String(d2)).getTime();
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    return Math.round((b - a) / 3600000);
  });
  db.create_function("_TSDIFF_MINUTE", (d1: unknown, d2: unknown) => {
    const a = new Date(String(d1)).getTime();
    const b = new Date(String(d2)).getTime();
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    return Math.round((b - a) / 60000);
  });
  db.create_function("_TSDIFF_SECOND", (d1: unknown, d2: unknown) => {
    const a = new Date(String(d1)).getTime();
    const b = new Date(String(d2)).getTime();
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    return Math.round((b - a) / 1000);
  });

  const addUnit = (d: unknown, n: unknown, unit: "year" | "month" | "day" | "hour" | "minute" | "second") => {
    const dt = _dateParse(d);
    if (!dt) return null;
    const amt = Number(n);
    const out = new Date(dt);
    if (unit === "year") out.setFullYear(out.getFullYear() + amt);
    else if (unit === "month") out.setMonth(out.getMonth() + amt);
    else if (unit === "day") out.setDate(out.getDate() + amt);
    else if (unit === "hour") out.setHours(out.getHours() + amt);
    else if (unit === "minute") out.setMinutes(out.getMinutes() + amt);
    else if (unit === "second") out.setSeconds(out.getSeconds() + amt);
    return out.toISOString().slice(0, unit === "day" || unit === "month" || unit === "year" ? 10 : 19).replace("T", " ");
  };
  db.create_function("_DATE_ADD_DAY", (d: unknown, n: unknown) => addUnit(d, n, "day"));
  db.create_function("_DATE_ADD_MONTH", (d: unknown, n: unknown) => addUnit(d, n, "month"));
  db.create_function("_DATE_ADD_YEAR", (d: unknown, n: unknown) => addUnit(d, n, "year"));
  db.create_function("_DATE_ADD_HOUR", (d: unknown, n: unknown) => addUnit(d, n, "hour"));
  db.create_function("_DATE_ADD_MINUTE", (d: unknown, n: unknown) => addUnit(d, n, "minute"));
  db.create_function("_DATE_ADD_SECOND", (d: unknown, n: unknown) => addUnit(d, n, "second"));
  db.create_function("_DATE_SUB_DAY", (d: unknown, n: unknown) => addUnit(d, Number(n) * -1, "day"));
  db.create_function("_DATE_SUB_MONTH", (d: unknown, n: unknown) => addUnit(d, Number(n) * -1, "month"));
  db.create_function("_DATE_SUB_YEAR", (d: unknown, n: unknown) => addUnit(d, Number(n) * -1, "year"));
  db.create_function("_DATE_SUB_HOUR", (d: unknown, n: unknown) => addUnit(d, Number(n) * -1, "hour"));
  db.create_function("_DATE_SUB_MINUTE", (d: unknown, n: unknown) => addUnit(d, Number(n) * -1, "minute"));
  db.create_function("_DATE_SUB_SECOND", (d: unknown, n: unknown) => addUnit(d, Number(n) * -1, "second"));

  db.create_function("_DATE_FORMAT", (d: unknown, fmt: unknown) => {
    const dt = _dateParse(d);
    if (!dt) return null;
    let f = String(fmt);
    f = f.replace(/%Y/g, String(dt.getFullYear()));
    f = f.replace(/%m/g, String(dt.getMonth() + 1).padStart(2, "0"));
    f = f.replace(/%d/g, String(dt.getDate()).padStart(2, "0"));
    f = f.replace(/%H/g, String(dt.getHours()).padStart(2, "0"));
    f = f.replace(/%i/g, String(dt.getMinutes()).padStart(2, "0"));
    f = f.replace(/%s/g, String(dt.getSeconds()).padStart(2, "0"));
    f = f.replace(/%M/g, dt.toLocaleString("en-US", { month: "long" }));
    f = f.replace(/%b/g, dt.toLocaleString("en-US", { month: "short" }));
    f = f.replace(/%W/g, dt.toLocaleString("en-US", { weekday: "long" }));
    return f;
  });

  db.create_function("YEAR", (d: unknown) => {
    const dt = _dateParse(d);
    return dt ? dt.getFullYear() : null;
  });
  db.create_function("MONTH", (d: unknown) => {
    const dt = _dateParse(d);
    return dt ? dt.getMonth() + 1 : null;
  });
  db.create_function("DAY", (d: unknown) => {
    const dt = _dateParse(d);
    return dt ? dt.getDate() : null;
  });
  db.create_function("IF", (cond: unknown, t: unknown, f: unknown) => (cond ? t : f));
  db.create_function("CONCAT", (...args: unknown[]) => args.map(String).join(""));
  db.create_function("NOW", () => new Date().toISOString().replace("T", " ").slice(0, 19));
  db.create_function("CURDATE", () => new Date().toISOString().slice(0, 10));
  db.create_function("LEFT", (s: unknown, n: unknown) => String(s).slice(0, Number(n)));
  db.create_function("RIGHT", (s: unknown, n: unknown) => String(s).slice(-Number(n)));
  db.create_function("LPAD", (s: unknown, len: unknown, pad: unknown) => String(s).padStart(Number(len), String(pad)));
  db.create_function("RPAD", (s: unknown, len: unknown, pad: unknown) => String(s).padEnd(Number(len), String(pad)));
}

export function SqlPracticeEditor({
  questionId,
  title,
  difficulty,
  problemStatement,
  schemaSql,
  seedSql,
  expectedResult,
  submissions: initialSubmissions = [],
  prevSlug,
  nextSlug,
}: SqlPracticeEditorProps) {
  const [code, setCode] = useState("-- Write your SQL here\nSELECT 1;");
  const [leftTab, setLeftTab] = useState<LeftTab>("Description");
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [resultTab, setResultTab] = useState<ResultTab>("testcase");
  const [runOutput, setRunOutput] = useState<{
    type: "result" | "error";
    message?: string;
    rows?: Record<string, unknown>[];
  } | null>(null);
  const [submitState, setSubmitState] = useState<{
    passed: boolean;
    message?: string;
    attemptId?: string;
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [sampleData, setSampleData] = useState<Record<string, Record<string, unknown>[]>>({});

  const schemaTables = useMemo(() => parseSchema(schemaSql), [schemaSql]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (schemaTables.length === 0) return;
      try {
        const initSqlJs = (await import("sql.js")).default;
        const SQL = await initSqlJs({
          locateFile: (file: string) =>
            typeof window !== "undefined"
              ? `https://cdn.jsdelivr.net/npm/sql.js@1.14.0/dist/${file}`
              : `/${file}`,
        });
        const db = new SQL.Database();
        registerMySqlCompat(db);
        try {
          db.exec(schemaSql);
          db.exec(seedSql);
          const data: Record<string, Record<string, unknown>[]> = {};
          for (const table of schemaTables) {
            const { tableName, columns: schemaCols } = table;
            const columnNames = schemaCols.map((c) => c.name);
            try {
              const execResult = db.exec(`SELECT * FROM ${tableName}`);
              if (execResult.length > 0) {
                const first = execResult[0];
                const columns =
                  columnNames.length > 0
                    ? columnNames
                    : normalizeColumnNames(first?.columns);
                const values = Array.isArray(first?.values) ? first.values : [];
                const rowValues = Array.isArray(values) ? values : [];
                data[tableName] = rowValues.map((row) => {
                  const obj: Record<string, unknown> = {};
                  const arr = normalizeRowValues(row);
                  if (columns.length > 0) {
                    columns.forEach((col, i) => {
                      obj[String(col)] = arr[i];
                    });
                  } else {
                    arr.forEach((val, i) => {
                      obj[`Column ${i + 1}`] = val;
                    });
                  }
                  return obj;
                });
              } else {
                data[tableName] = [];
              }
            } catch {
              data[tableName] = [];
            }
          }
          if (!cancelled) setSampleData(data);
        } finally {
          try {
            db.close?.();
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore sample load errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [schemaSql, seedSql, schemaTables]);

  const runSql = useCallback(async () => {
    setRunOutput(null);
    setSubmitState(null);
    setFeedback(null);
    setResultTab("result");
    setLoading(true);
    try {
      const initSqlJs = (await import("sql.js")).default;
      const SQL = await initSqlJs({
        locateFile: (file: string) =>
          typeof window !== "undefined"
            ? `https://cdn.jsdelivr.net/npm/sql.js@1.14.0/dist/${file}`
            : `/${file}`,
      });
      const db = new SQL.Database();
      registerMySqlCompat(db);
      try {
        db.exec(schemaSql);
        db.exec(seedSql);
        const execResult = db.exec(rewriteMySqlSyntax(code));
        db.close();
        if (!Array.isArray(execResult) || execResult.length === 0) {
          setRunOutput({ type: "result", rows: [] });
          return;
        }
        const resultSet =
          execResult.find(
            (r) => {
              const vals = r?.values;
              const cols = normalizeColumnNames(r?.columns);
              return Array.isArray(vals) && vals.length > 0 && cols.length > 0;
            }
          ) ?? execResult[execResult.length - 1] ?? execResult[0];
        const columns = normalizeColumnNames(resultSet?.columns);
        const values = Array.isArray(resultSet?.values) ? resultSet.values : [];
        const rowValues = Array.isArray(values) ? values : [];
        const rows: Record<string, unknown>[] = rowValues.map((row) => {
          const obj: Record<string, unknown> = {};
          const arr = normalizeRowValues(row);
          if (columns.length > 0) {
            columns.forEach((col, i) => {
              obj[String(col)] = arr[i];
            });
          } else {
            arr.forEach((val, i) => {
              obj[`Column ${i + 1}`] = val;
            });
          }
          return obj;
        });
        const displayRows =
          expectedResult.length > 0 && rows.length > 0
            ? (() => {
                const expectedKeys = Object.keys(expectedResult[0]);
                const rowKeys = Object.keys(rows[0]);
                const isGeneric = rowKeys.every(
                  (k, i) => k === `Column ${i + 1}`
                );
                if (isGeneric && expectedKeys.length === rowKeys.length) {
                  return rows.map((row) => {
                    const out: Record<string, unknown> = {};
                    expectedKeys.forEach((ek, i) => {
                      out[ek] = row[`Column ${i + 1}`];
                    });
                    return out;
                  });
                }
                return rows;
              })()
            : rows;
        setRunOutput({ type: "result", rows: displayRows });
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        setRunOutput({ type: "error", message: err });
      } finally {
        try {
          db.close?.();
        } catch {
          // ignore
        }
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setRunOutput({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }, [schemaSql, seedSql, code]);

  const handleSubmit = useCallback(async () => {
    setSubmitState(null);
    setRunOutput(null);
    setFeedback(null);
    setResultTab("result");
    setLoading(true);
    try {
      const initSqlJs = (await import("sql.js")).default;
      const SQL = await initSqlJs({
        locateFile: (file: string) =>
          typeof window !== "undefined"
            ? `https://cdn.jsdelivr.net/npm/sql.js@1.14.0/dist/${file}`
            : `/${file}`,
      });
      const db = new SQL.Database();
      registerMySqlCompat(db);
      let actualRows: Record<string, unknown>[] = [];
      let runError: string | null = null;
      try {
        db.exec(schemaSql);
        db.exec(seedSql);
        const execResult = db.exec(rewriteMySqlSyntax(code));
        if (Array.isArray(execResult) && execResult.length > 0) {
          const resultSet =
            execResult.find((r) => {
              const vals = r?.values;
              const cols = normalizeColumnNames(r?.columns);
              return Array.isArray(vals) && vals.length > 0 && cols.length > 0;
            }) ?? execResult[execResult.length - 1] ?? execResult[0];
          const columns = normalizeColumnNames(resultSet?.columns);
          const values = Array.isArray(resultSet?.values) ? resultSet.values : [];
          const rowValues = Array.isArray(values) ? values : [];
          actualRows = rowValues.map((row) => {
            const obj: Record<string, unknown> = {};
            const arr = normalizeRowValues(row);
            if (columns.length > 0) {
              columns.forEach((col, i) => {
                obj[String(col)] = arr[i];
              });
            } else {
              arr.forEach((val, i) => {
                obj[`Column ${i + 1}`] = val;
              });
            }
            return obj;
          });
        }
      } catch (e) {
        runError = e instanceof Error ? e.message : String(e);
      } finally {
        try {
          db.close?.();
        } catch {
          // ignore
        }
      }
      if (runError) {
        setSubmitState({ passed: false, message: runError });
        setRunOutput({ type: "error", message: runError });
        const res = await submitAttemptAction(questionId, code, false);
        if (res.ok) setSubmitState((s) => (s ? { ...s, attemptId: res.attemptId } : s));
        setLoading(false);
        return;
      }
      const actualForCompare =
        actualRows.length > 0 &&
        Array.isArray(expectedResult) &&
        expectedResult.length > 0 &&
        typeof expectedResult[0] === "object" &&
        expectedResult[0] !== null
          ? (() => {
              const firstActual = actualRows[0];
              const actualKeys = Object.keys(firstActual);
              const expectedKeys = Object.keys(expectedResult[0] as Record<string, unknown>);
              const isGeneric = actualKeys.every((k, i) => k === `Column ${i + 1}`);
              if (isGeneric && expectedKeys.length === actualKeys.length) {
                return actualRows.map((row) => {
                  const out: Record<string, unknown> = {};
                  expectedKeys.forEach((ek, i) => {
                    out[ek] = (row as Record<string, unknown>)[`Column ${i + 1}`];
                  });
                  return out;
                });
              }
              return actualRows;
            })()
          : actualRows;
      const { passed, message } = compareSqlResult(actualForCompare, expectedResult);
      const runResultPayload =
        actualForCompare.length > 0
          ? (JSON.parse(JSON.stringify(actualForCompare)) as Record<string, unknown>[])
          : undefined;
      const res = await submitAttemptAction(
        questionId,
        code,
        passed,
        runResultPayload
      );
      if (!res.ok) {
        setSubmitState({ passed, message: res.error });
      } else {
        setSubmitState({
          passed,
          message,
          attemptId: res.attemptId,
        });
        setSubmissions((prev) => [
          {
            id: res.attemptId,
            submittedSql: code,
            passed,
            aiFeedback: null,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
      setRunOutput({ type: "result", rows: actualForCompare });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setSubmitState({ passed: false, message });
    } finally {
      setLoading(false);
    }
  }, [questionId, schemaSql, seedSql, code, expectedResult]);

  const handleRequestFeedback = useCallback(async () => {
    const attemptId = submitState?.attemptId;
    if (!attemptId) return;
    setFeedbackLoading(true);
    setFeedback(null);
    try {
      const res = await requestSqlFeedbackAction(attemptId);
      if (res.ok) setFeedback(res.feedback);
      else setFeedback(`Error: ${res.error}`);
    } finally {
      setFeedbackLoading(false);
    }
  }, [submitState?.attemptId]);

  return (
    <>
      {/* Left panel: problem & schema */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex border-b border-neutral-200 dark:border-neutral-800">
          {LEFT_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setLeftTab(tab)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                leftTab === tab
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {leftTab === "Description" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <h1 className="text-lg font-bold text-neutral-900 dark:text-white">
                  {title}
                </h1>
                {difficulty && (
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      difficulty.toLowerCase() === "easy"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : difficulty.toLowerCase() === "medium"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </span>
                )}
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-neutral-900 dark:prose-headings:text-white prose-p:leading-relaxed prose-p:text-neutral-700 dark:prose-p:text-neutral-300 prose-strong:text-neutral-900 dark:prose-strong:text-white prose-code:rounded prose-code:bg-neutral-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-medium prose-code:text-neutral-800 dark:prose-code:bg-neutral-800 dark:prose-code:text-neutral-200 prose-li:text-neutral-700 dark:prose-li:text-neutral-300">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children }) => (
                      <div className="my-3 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <table className="w-full border-collapse text-left text-sm">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-neutral-50 dark:bg-neutral-800">{children}</thead>
                    ),
                    th: ({ children }) => (
                      <th className="border-b border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border-b border-neutral-100 px-3 py-1.5 font-mono text-xs text-neutral-600 last:border-0 dark:border-neutral-700 dark:text-neutral-400">
                        {children}
                      </td>
                    ),
                    tr: ({ children }) => (
                      <tr className="last:border-0">{children}</tr>
                    ),
                    hr: () => (
                      <hr className="my-6 border-neutral-200 dark:border-neutral-700" />
                    ),
                  }}
                >
                  {problemStatement}
                </ReactMarkdown>
              </div>
              {Array.isArray(expectedResult) && expectedResult.length > 0 && (
                <div className="space-y-3 border-t border-neutral-200 pt-5 dark:border-neutral-700">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Expected Output
                  </h3>
                  <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                    Your query must return a table with exactly these columns. Column order and row order are ignored when checking; only the set of rows must match.
                  </p>
                  {(() => {
                    const first = expectedResult[0];
                    const expKeys =
                      first !== null && typeof first === "object" && Object.keys(first).length > 0
                        ? Object.keys(first)
                        : [];
                    if (expKeys.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-2">
                        {expKeys.map((col) => (
                          <span
                            key={col}
                            className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 font-mono text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
          {leftTab === "Submissions" && (
            <div className="space-y-3">
              {submissions.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  No submissions yet. Write a query and hit Submit.
                </p>
              ) : (
                submissions.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    className="w-full rounded-lg border border-neutral-200 bg-white p-3 text-left transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-750"
                    onClick={() => {
                      setCode(sub.submittedSql);
                      setLeftTab("Description");
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-semibold ${
                          sub.passed
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {sub.passed ? "Accepted" : "Wrong Answer"}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {new Date(sub.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <pre className="mt-2 max-h-[80px] overflow-hidden text-ellipsis whitespace-pre-wrap font-mono text-xs text-neutral-600 dark:text-neutral-400">
                      {sub.submittedSql}
                    </pre>
                    {sub.aiFeedback && (
                      <p className="mt-2 border-t border-neutral-100 pt-2 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">AI: </span>
                        {sub.aiFeedback.slice(0, 150)}
                        {sub.aiFeedback.length > 150 ? "…" : ""}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: code + results */}
      <div className="flex min-w-0 flex-[1.2] flex-col overflow-hidden bg-neutral-50 dark:bg-neutral-950">
        <div className="flex shrink-0 items-center gap-2 border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <Link
            href="/sql-practice"
            className="rounded p-1 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white"
            aria-label="Back to SQL Practice"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            &lt;/&gt; Code
          </span>
          <span className="ml-2 rounded bg-neutral-200 px-2 py-0.5 text-xs font-mono text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
            MySQL
          </span>
        </div>
        <div className="shrink-0">
          <CodeMirror
            value={code}
            height="280px"
            extensions={[sql()]}
            onChange={setCode}
            basicSetup={{ lineNumbers: true }}
            className="text-sm [&_.cm-editor]:outline-none"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2 border-t border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <Button
            type="button"
            variant="secondary"
            onClick={runSql}
            disabled={loading}
          >
            {loading ? "Running…" : "Run"}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting…" : "Submit"}
          </Button>
          <div className="ml-auto flex items-center gap-2">
            {prevSlug && (
              <Link href={`/sql-practice/${prevSlug}`}>
                <Button type="button" variant="secondary">
                  ← Prev
                </Button>
              </Link>
            )}
            {nextSlug && (
              <Link href={`/sql-practice/${nextSlug}`}>
                <Button type="button" variant="secondary">
                  Next →
                </Button>
              </Link>
            )}
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex border-b border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setResultTab("testcase")}
              className={`border-b-2 px-4 py-2 text-sm font-medium ${
                resultTab === "testcase"
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-neutral-600 dark:text-neutral-400"
              }`}
            >
              Testcase
            </button>
            <button
              type="button"
              onClick={() => setResultTab("result")}
              className={`border-b-2 px-4 py-2 text-sm font-medium ${
                resultTab === "result"
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-neutral-600 dark:text-neutral-400"
              }`}
            >
              Test Result
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {resultTab === "testcase" && (
              <div className="space-y-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Sample input data used when you Run or Submit.
                </p>
                {Object.entries(sampleData).map(([tableName, rows]) => (
                  <div key={tableName}>
                    <p className="mb-1 font-mono text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {tableName} =
                    </p>
                    {rows.length > 0 ? (
                      <div className="max-h-[240px] overflow-auto rounded border border-neutral-200 dark:border-neutral-700">
                        <table className="w-full text-left text-sm">
                          <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-800">
                            <tr className="border-b border-neutral-200 dark:border-neutral-700">
                              {Object.keys(rows[0]).map((k) => (
                                <th
                                  key={k}
                                  className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300"
                                >
                                  {k}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row, i) => (
                              <tr
                                key={i}
                                className="border-b border-neutral-100 dark:border-neutral-700"
                              >
                                {Object.values(row).map((v, j) => (
                                  <td
                                    key={j}
                                    className="px-3 py-2 font-mono text-neutral-600 dark:text-neutral-400"
                                  >
                                    {String(v)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        (empty)
                      </p>
                    )}
                  </div>
                ))}
                {Object.keys(sampleData).length === 0 && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Loading sample data…
                  </p>
                )}
              </div>
            )}
            {resultTab === "result" && (
              <div className="min-h-[120px] space-y-3">
                {submitState && (
                  <div className="flex items-center gap-2">
                    {submitState.passed ? (
                      <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                        Accepted
                      </span>
                    ) : (
                      <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                        Wrong Answer
                      </span>
                    )}
                    {submitState.message && (
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {submitState.message}
                      </span>
                    )}
                  </div>
                )}
                {loading && !runOutput && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Running…
                  </p>
                )}
                {!loading && !runOutput && !submitState && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Run your code or Submit to see the result here.
                  </p>
                )}
                {runOutput?.type === "error" && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {runOutput.message}
                  </p>
                )}
                {runOutput?.type === "result" && runOutput.rows !== undefined && (
                  <>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Output
                      {runOutput.rows.length >= 0 && (
                        <span className="ml-2 font-normal text-neutral-500 dark:text-neutral-400">
                          ({runOutput.rows.length} row{runOutput.rows.length !== 1 ? "s" : ""})
                        </span>
                      )}
                    </p>
                    <div className="min-h-[80px] max-h-[320px] overflow-auto rounded border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
                    {runOutput.rows.length > 0 ? (
                      (() => {
                        const firstRow = runOutput.rows[0];
                        let keys: string[] =
                          firstRow !== null && typeof firstRow === "object" ? Object.keys(firstRow) : [];
                        if (keys.length === 0) {
                          const withKeys = runOutput.rows.find((r) => r && typeof r === "object" && Object.keys(r).length > 0);
                          keys = withKeys
                            ? Object.keys(withKeys)
                            : Array.from(
                                { length: Math.max(1, ...runOutput.rows.map((r) => (r && typeof r === "object" ? Object.values(r).length : 0))) },
                                (_, i) => `Column ${i + 1}`
                              );
                        }
                        const isGenericKeys = keys.length > 0 && keys.every((k, i) => k === `Column ${i + 1}`);
                        const schemaNames =
                          isGenericKeys && schemaTables.length > 0
                            ? schemaTables.find((t) => t.columns.length === keys.length)?.columns.map((c) => c.name)
                            : null;
                        const headerLabels = schemaNames && schemaNames.length === keys.length ? schemaNames : keys;
                        return (
                          <table className="w-full min-w-[200px] table-auto border-collapse text-left text-sm">
                            <thead className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-800">
                              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                                {keys.map((k, idx) => (
                                  <th
                                    key={String(k)}
                                    className="border-b border-neutral-200 px-3 py-2 font-medium text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
                                  >
                                    {(headerLabels[idx] ?? String(k)) || "\u00a0"}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {runOutput.rows.map((row, i) => (
                                <tr
                                  key={i}
                                  className="border-b border-neutral-100 dark:border-neutral-800"
                                >
                                  {keys.map((k) => {
                                    const val = row && typeof row === "object" && k in row ? (row as Record<string, unknown>)[k] : null;
                                    return (
                                      <td
                                        key={String(k)}
                                        className="border-b border-neutral-100 px-3 py-2 font-mono text-neutral-700 dark:border-neutral-800 dark:text-neutral-300"
                                      >
                                        {val === null || val === undefined ? "\u00a0" : String(val)}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      })()
                    ) : (
                      <p className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">
                        No rows returned.
                      </p>
                    )}
                  </div>
                  {submitState && !submitState.passed && expectedResult.length > 0 && (() => {
                    const first = expectedResult[0];
                    const expKeys =
                      first !== null && typeof first === "object" ? Object.keys(first) : [];
                    if (expKeys.length === 0) return null;
                    return (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Expected
                        </p>
                        <div className="max-h-[200px] overflow-auto rounded border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
                          <table className="w-full min-w-[200px] table-auto border-collapse text-left text-sm">
                            <thead className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-800">
                              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                                {expKeys.map((col) => (
                                  <th
                                    key={col}
                                    className="border-b border-neutral-200 px-3 py-2 font-medium text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
                                  >
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {expectedResult.map((row, i) => (
                                <tr
                                  key={i}
                                  className="border-b border-neutral-100 dark:border-neutral-800"
                                >
                                  {expKeys.map((k) => {
                                    const val = row !== null && typeof row === "object" && k in row
                                      ? (row as Record<string, unknown>)[k]
                                      : null;
                                    return (
                                      <td
                                        key={k}
                                        className="border-b border-neutral-100 px-3 py-2 font-mono text-neutral-700 dark:border-neutral-800 dark:text-neutral-300"
                                      >
                                        {val === null || val === undefined ? "\u00a0" : String(val)}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                  </>
                )}
                {submitState?.attemptId && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-sm"
                    onClick={handleRequestFeedback}
                    disabled={feedbackLoading}
                  >
                    {feedbackLoading ? "Loading…" : "Get AI feedback"}
                  </Button>
                )}
                {feedback && (
                  <div className="rounded border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
                    <p className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      AI feedback
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-400">
                      {feedback}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
