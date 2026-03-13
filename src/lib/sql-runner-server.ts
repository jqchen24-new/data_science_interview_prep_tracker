/**
 * Server-side SQL execution for API (sql.js). Keeps same MySQL compat as client.
 */
import path from "path";

function rewriteMySqlSyntax(query: string): string {
  let q = query;
  q = q.replace(
    /TIMESTAMPDIFF\s*\(\s*(YEAR|MONTH|DAY|HOUR|MINUTE|SECOND)\s*,/gi,
    (_match, unit: string) => `_TSDIFF_${unit.toUpperCase()}(`
  );
  q = q.replace(
    /DATE_ADD\s*\(\s*([^,]+?)\s*,\s*INTERVAL\s+(.+?)\s+(YEAR|MONTH|DAY|HOUR|MINUTE|SECOND)\s*\)/gi,
    (_match, dateExpr: string, amount: string, unit: string) =>
      `_DATE_ADD_${unit.toUpperCase()}(${dateExpr}, ${amount})`
  );
  q = q.replace(
    /DATE_SUB\s*\(\s*([^,]+?)\s*,\s*INTERVAL\s+(.+?)\s+(YEAR|MONTH|DAY|HOUR|MINUTE|SECOND)\s*\)/gi,
    (_match, dateExpr: string, amount: string, unit: string) =>
      `_DATE_SUB_${unit.toUpperCase()}(${dateExpr}, ${amount})`
  );
  q = q.replace(/DATE_FORMAT\s*\(/gi, "_DATE_FORMAT(");
  return q;
}

function _dateParse(d: unknown): Date | null {
  const dt = new Date(String(d));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

type SqlJsDb = {
  exec: (sql: string) => unknown[];
  create_function: (name: string, fn: (...args: unknown[]) => unknown) => void;
  close: () => void;
};

function registerMySqlCompat(db: SqlJsDb): void {
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
  ["DAY", "MONTH", "YEAR", "HOUR", "MINUTE", "SECOND"].forEach((u) => {
    const unit = u.toLowerCase() as "day" | "month" | "year" | "hour" | "minute" | "second";
    db.create_function(`_DATE_ADD_${u}`, (d: unknown, n: unknown) => addUnit(d, n, unit));
    db.create_function(`_DATE_SUB_${u}`, (d: unknown, n: unknown) => addUnit(d, Number(n) * -1, unit));
  });
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
    return f;
  });
  db.create_function("YEAR", (d: unknown) => (_dateParse(d) ? _dateParse(d)!.getFullYear() : null));
  db.create_function("MONTH", (d: unknown) => (_dateParse(d) ? _dateParse(d)!.getMonth() + 1 : null));
  db.create_function("DAY", (d: unknown) => (_dateParse(d) ? _dateParse(d)!.getDate() : null));
  db.create_function("IF", (cond: unknown, t: unknown, f: unknown) => (cond ? t : f));
  db.create_function("CONCAT", (...args: unknown[]) => args.map(String).join(""));
  db.create_function("NOW", () => new Date().toISOString().replace("T", " ").slice(0, 19));
  db.create_function("CURDATE", () => new Date().toISOString().slice(0, 10));
  db.create_function("LEFT", (s: unknown, n: unknown) => String(s).slice(0, Number(n)));
  db.create_function("RIGHT", (s: unknown, n: unknown) => String(s).slice(-Number(n)));
  db.create_function("LPAD", (s: unknown, len: unknown, pad: unknown) => String(s).padStart(Number(len), String(pad)));
  db.create_function("RPAD", (s: unknown, len: unknown, pad: unknown) => String(s).padEnd(Number(len), String(pad)));
}

function resultSetToRows(columns: string[], values: unknown[][]): Record<string, unknown>[] {
  return (values || []).map((row) => {
    const obj: Record<string, unknown> = {};
    (columns || []).forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

export type RunSqlResult =
  | { ok: true; rows: Record<string, unknown>[] }
  | { ok: false; error: string };

export async function runSqlServer(
  schemaSql: string,
  seedSql: string,
  userSql: string
): Promise<RunSqlResult> {
  try {
    const initSqlJs = (await import("sql.js")).default;
    const wasmPath = path.join(process.cwd(), "node_modules", "sql.js", "dist", "sql-wasm.wasm");
    const SQL = await initSqlJs({ locateFile: () => wasmPath });
    const db = new SQL.Database() as SqlJsDb;
    registerMySqlCompat(db);
    try {
      db.exec(schemaSql);
      db.exec(seedSql);
      const execResult = db.exec(rewriteMySqlSyntax(userSql));
      if (!Array.isArray(execResult) || execResult.length === 0) {
        return { ok: true, rows: [] };
      }
      const last = execResult[execResult.length - 1];
      const columns = (last as { columns?: string[] }).columns ?? [];
      const values = (last as { values?: unknown[][] }).values ?? [];
      const rows = resultSetToRows(columns, values);
      return { ok: true, rows };
    } finally {
      db.close();
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}
