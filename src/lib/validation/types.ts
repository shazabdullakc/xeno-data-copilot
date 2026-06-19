// Core types for the data-onboarding co-pilot validation engine.
// Everything downstream (detection, validators, fixers, report) speaks these.

/** Semantic meaning we infer for a column, beyond its raw header. */
export type FieldType =
  | "phone"
  | "date"
  | "email"
  | "amount"
  | "id"
  | "payment_mode"
  | "text"
  | "unknown";

/** Severity drives the health score and how loudly we surface an issue. */
export type Severity = "error" | "warning" | "info";

/** A single problem found in one cell, in plain English. */
export interface CellIssue {
  readonly rowIndex: number; // 0-based index into data rows (not counting header)
  readonly column: string;
  readonly severity: Severity;
  readonly code: string; // machine code, e.g. "phone.wrong_length"
  readonly message: string; // human-readable, client-facing
  readonly rawValue: string;
  readonly suggestedFix?: string; // value we'd auto-apply if the user accepts
}

/** What we learned about a single column after scanning all its values. */
export interface ColumnReport {
  readonly name: string;
  readonly detectedType: FieldType;
  readonly confidence: number; // 0..1, how sure we are about detectedType
  readonly detail?: string; // e.g. "India (+91), 10 digits" or "DD/MM/YYYY"
  readonly totalCount: number;
  readonly emptyCount: number;
  readonly issueCount: number;
  readonly fixableCount: number;
}

/** The full result the UI renders and the engine emits. */
export interface ValidationResult {
  readonly headers: readonly string[];
  readonly rowCount: number;
  readonly columns: readonly ColumnReport[];
  readonly issues: readonly CellIssue[];
  readonly duplicateRows: readonly number[]; // indices of rows that duplicate an earlier row
  readonly healthScore: number; // 0..100
  readonly summary: string; // one-line plain-English verdict
}

/** A parsed table: header row + string cells. Engine never sees raw CSV text. */
export interface Table {
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
}
