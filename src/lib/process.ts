// Browser-side orchestration: raw CSV text in, everything the UI needs out.
// Pure and synchronous — the engine is fast enough to run on the main thread
// for assignment-scale files.

import { parseCsv } from "./csv";
import { ColumnPlan, planColumns, validateTable, cleanTable } from "./validation/engine";
import { ValidationResult, Table } from "./validation/types";

export interface ProcessedCsv {
  readonly table: Table;
  readonly plan: ColumnPlan[];
  readonly result: ValidationResult;
}

export function processCsv(text: string): ProcessedCsv {
  const table = parseCsv(text);
  const plan = planColumns(table);
  const result = validateTable(table, plan);
  return { table, plan, result };
}

/** Re-validate against a user-edited plan (e.g. they overrode a detected country). */
export function reprocess(table: Table, plan: ColumnPlan[]): ValidationResult {
  return validateTable(table, plan);
}

export { cleanTable };
