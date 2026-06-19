// The orchestrator. Turns a parsed Table into a ValidationResult and can emit
// a cleaned Table by applying the fixes it suggested. Detection runs once per
// column (cheap), then validation runs per cell against the detected plan.

import { CellIssue, ColumnReport, FieldType, Table, ValidationResult } from "./types";
import { detectColumnType } from "./detect/columnType";
import { detectPhoneCountry } from "./detect/phoneCountry";
import { detectDateFormat } from "./detect/dateFormat";
import { findDuplicateRows } from "./detect/duplicates";
import { parsePhone } from "./validators/phone";
import { parseDate, DateFormat } from "./validators/date";
import { parseEmail } from "./validators/email";
import { parseAmount } from "./validators/amount";

/** What we decided about a column before validating it. */
export interface ColumnPlan {
  readonly name: string;
  readonly index: number;
  readonly type: FieldType;
  readonly confidence: number;
  readonly country?: string; // for phone columns
  readonly dateFormat?: DateFormat; // for date columns
  readonly detail?: string; // human label, e.g. "India (+91), 10 digits"
}

function columnValues(table: Table, index: number): string[] {
  return table.rows.map((r) => r[index] ?? "");
}

/** Build a detection plan for every column. Exposed so the UI can show/override it. */
export function planColumns(table: Table): ColumnPlan[] {
  return table.headers.map((name, index) => {
    const values = columnValues(table, index);
    const { type, confidence } = detectColumnType(name, values);

    if (type === "phone") {
      const guess = detectPhoneCountry(values);
      return {
        name, index, type, confidence,
        country: guess?.iso ?? "IN",
        detail: guess ? `${guess.name} (${Math.round(guess.confidence * 100)}% match)` : "phone",
      };
    }
    if (type === "date") {
      const guess = detectDateFormat(values);
      return {
        name, index, type, confidence,
        dateFormat: guess?.format ?? "YYYY-MM-DD",
        detail: guess?.format ?? "date",
      };
    }
    return { name, index, type, confidence, detail: type };
  });
}

/** Validate one cell against its column plan. Returns an issue or null. */
function validateCell(plan: ColumnPlan, rowIndex: number, raw: string): CellIssue | null {
  const value = raw ?? "";
  const base = { rowIndex, column: plan.name, rawValue: value };

  // Empty cells: warn (info for free-text), never hard-error.
  if (value.trim() === "") {
    if (plan.type === "text" || plan.type === "unknown") return null;
    return { ...base, severity: "warning", code: "empty", message: `Missing ${plan.type}` };
  }

  switch (plan.type) {
    case "phone": {
      const p = parsePhone(value, plan.country ?? "IN");
      return p.isValid ? null : { ...base, severity: "error", code: "phone.invalid", message: p.reason ?? "Invalid phone", suggestedFix: p.normalized };
    }
    case "date": {
      const d = parseDate(value, plan.dateFormat ?? "YYYY-MM-DD");
      return d.isValid ? null : { ...base, severity: "error", code: "date.invalid", message: d.reason ?? "Invalid date", suggestedFix: d.normalized };
    }
    case "email": {
      const e = parseEmail(value);
      return e.isValid ? null : { ...base, severity: "error", code: "email.invalid", message: e.reason ?? "Invalid email", suggestedFix: e.normalized };
    }
    case "amount": {
      const a = parseAmount(value);
      return a.isValid ? null : { ...base, severity: "warning", code: "amount.invalid", message: a.reason ?? "Invalid amount", suggestedFix: a.normalized };
    }
    default:
      return null;
  }
}

export function validateTable(table: Table, plan?: ColumnPlan[]): ValidationResult {
  const plans = plan ?? planColumns(table);
  const issues: CellIssue[] = [];
  const perColumnIssues = new Map<string, number>();
  const perColumnFixable = new Map<string, number>();
  const perColumnEmpty = new Map<string, number>();

  table.rows.forEach((row, rowIndex) => {
    plans.forEach((p) => {
      const raw = row[p.index] ?? "";
      if (raw.trim() === "") perColumnEmpty.set(p.name, (perColumnEmpty.get(p.name) ?? 0) + 1);
      const issue = validateCell(p, rowIndex, raw);
      if (issue) {
        issues.push(issue);
        perColumnIssues.set(p.name, (perColumnIssues.get(p.name) ?? 0) + 1);
        if (issue.suggestedFix !== undefined) perColumnFixable.set(p.name, (perColumnFixable.get(p.name) ?? 0) + 1);
      }
    });
  });

  const columns: ColumnReport[] = plans.map((p) => ({
    name: p.name,
    detectedType: p.type,
    confidence: p.confidence,
    detail: p.detail,
    totalCount: table.rows.length,
    emptyCount: perColumnEmpty.get(p.name) ?? 0,
    issueCount: perColumnIssues.get(p.name) ?? 0,
    fixableCount: perColumnFixable.get(p.name) ?? 0,
  }));

  const duplicateRows = findDuplicateRows(table);

  // Cell issues weight by severity; each duplicate row adds a warning-equivalent penalty.
  const totalCells = Math.max(1, table.rows.length * plans.length);
  const cellWeight = issues.reduce((s, i) => s + (i.severity === "error" ? 1 : 0.4), 0);
  const errorWeight = cellWeight + duplicateRows.length * 0.4;
  const healthScore = Math.max(0, Math.round(100 - (errorWeight / totalCells) * 100));

  return {
    headers: table.headers,
    rowCount: table.rows.length,
    columns,
    issues,
    duplicateRows,
    healthScore,
    summary: buildSummary(table.rows.length, issues.length, duplicateRows.length, healthScore),
  };
}

function buildSummary(rows: number, issueCount: number, duplicateCount: number, score: number): string {
  if (issueCount === 0 && duplicateCount === 0) return `All ${rows} rows look clean — ready to onboard.`;
  const verdict = score >= 90 ? "mostly clean" : score >= 70 ? "needs light cleanup" : "needs attention";
  const dupePart = duplicateCount > 0 ? ` · ${duplicateCount} duplicate row${duplicateCount === 1 ? "" : "s"}` : "";
  return `${rows} rows scanned · ${issueCount} issue${issueCount === 1 ? "" : "s"} found${dupePart} · ${verdict}.`;
}

/**
 * Produce a cleaned copy of the table: apply every suggested cell fix and drop
 * duplicate rows (keeping the first occurrence).
 */
export function cleanTable(table: Table, plan?: ColumnPlan[]): Table {
  const plans = plan ?? planColumns(table);
  const byIndex = new Map(plans.map((p) => [p.index, p]));
  const duplicates = new Set(findDuplicateRows(table));

  const rows = table.rows
    .map((row, rowIndex) => ({ row, rowIndex }))
    .filter(({ rowIndex }) => !duplicates.has(rowIndex))
    .map(({ row, rowIndex }) =>
      row.map((cell, colIndex) => {
        const p = byIndex.get(colIndex);
        if (!p) return cell;
        const issue = validateCell(p, rowIndex, cell ?? "");
        return issue?.suggestedFix ?? cell;
      })
    );

  return { headers: table.headers, rows };
}
