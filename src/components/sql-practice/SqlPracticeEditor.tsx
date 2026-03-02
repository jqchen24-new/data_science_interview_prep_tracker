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

type SqlPracticeEditorProps = {
  questionId: string;
  title: string;
  difficulty?: string;
  problemStatement: string;
  schemaSql: string;
  seedSql: string;
  expectedResult: Record<string, unknown>[];
};

const LEFT_TABS = ["Description", "Accepted", "Editorial", "Solutions", "Submissions"] as const;
type LeftTab = (typeof LEFT_TABS)[number];

type ResultTab = "testcase" | "result";

export function SqlPracticeEditor({
  questionId,
  title,
  difficulty,
  problemStatement,
  schemaSql,
  seedSql,
  expectedResult,
}: SqlPracticeEditorProps) {
  const [code, setCode] = useState("-- Write your SQL here\nSELECT 1;");
  const [leftTab, setLeftTab] = useState<LeftTab>("Description");
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
      try {
        db.exec(schemaSql);
        db.exec(seedSql);
        const execResult = db.exec(code);
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
        setRunOutput({ type: "result", rows });
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
      let actualRows: Record<string, unknown>[] = [];
      let runError: string | null = null;
      try {
        db.exec(schemaSql);
        db.exec(seedSql);
        const execResult = db.exec(code);
        if (Array.isArray(execResult) && execResult.length > 0) {
          const resultSet = execResult[execResult.length - 1];
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
        actualRows.length > 0
          ? (JSON.parse(JSON.stringify(actualRows)) as Record<string, unknown>[])
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
      }
      setRunOutput({ type: "result", rows: actualRows });
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
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {leftTab === "Description" && (
            <div className="space-y-4">
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
                {title}
              </h1>
              {difficulty && (
                <div className="flex flex-wrap gap-2">
                  <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-600 dark:text-neutral-200">
                    {difficulty}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
                <span className="font-medium text-blue-600 dark:text-blue-400">SQL Schema</span>
                <span className="text-neutral-400 dark:text-neutral-500">&gt;</span>
                <span>Pandas Schema</span>
                <span className="text-neutral-400 dark:text-neutral-500">&gt;</span>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-neutral-600 prose-p:dark:text-neutral-400">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {problemStatement}
                </ReactMarkdown>
              </div>
              {Array.isArray(expectedResult) && expectedResult.length >= 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    Expected output
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Your query must return a table with exactly these columns and row(s). Column order and row order are ignored when checking; only the set of rows must match.
                  </p>
                  {expectedResult.length > 0 ? (
                    (() => {
                      const first = expectedResult[0];
                      const expKeys =
                        first !== null && typeof first === "object" && Object.keys(first).length > 0
                          ? Object.keys(first)
                          : ["(no columns)"];
                      return (
                        <div className="overflow-hidden rounded border border-neutral-200 dark:border-neutral-700">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800">
                                {expKeys.map((col) => (
                                  <th
                                    key={String(col)}
                                    className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300"
                                  >
                                    {String(col)}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {expectedResult.map((row, i) => (
                                <tr
                                  key={i}
                                  className="border-b border-neutral-100 last:border-0 dark:border-neutral-700"
                                >
                                  {expKeys.map((k) => (
                                    <td
                                      key={String(k)}
                                      className="px-3 py-2 font-mono text-neutral-600 dark:text-neutral-400"
                                    >
                                      {row !== null && typeof row === "object" && k in row
                                        ? String((row as Record<string, unknown>)[k])
                                        : "\u00a0"}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()
                  ) : (
                    <p className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                      (empty result — 0 rows)
                    </p>
                  )}
                </div>
              )}
              {schemaTables.length > 0 && (
                <div className="space-y-4">
                  {schemaTables.map(({ tableName, columns }) => (
                    <div key={tableName}>
                      <p className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Table: {tableName}
                      </p>
                      <div className="overflow-hidden rounded border border-neutral-200 dark:border-neutral-700">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800">
                              <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">
                                Column Name
                              </th>
                              <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">
                                Type
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {columns.map((col) => (
                              <tr
                                key={col.name}
                                className="border-b border-neutral-100 last:border-0 dark:border-neutral-700"
                              >
                                <td className="font-mono px-3 py-2 text-neutral-800 dark:text-neutral-200">
                                  {col.name}
                                </td>
                                <td className="font-mono px-3 py-2 text-neutral-600 dark:text-neutral-400">
                                  {col.type ?? "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {leftTab !== "Description" && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Coming soon.
            </p>
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
            SQLite
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
