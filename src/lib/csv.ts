// Minimal, dependency-free CSV parse/serialize. Handles quoted fields,
// embedded commas, escaped quotes ("") and CRLF. The app may swap in PapaParse
// for very large files, but this keeps the engine self-contained and testable.

import { Table } from "./validation/types";

export function parseCsv(text: string): Table {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => { rows.push(row); row = []; };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === ",") pushField();
    else if (ch === "\n") { pushField(); pushRow(); }
    else if (ch === "\r") { /* swallow, \n handles the break */ }
    else field += ch;
  }
  // Flush trailing field/row if the file didn't end with a newline.
  if (field !== "" || row.length > 0) { pushField(); pushRow(); }

  const nonEmpty = rows.filter((r) => !(r.length === 1 && r[0] === ""));
  const [headers = [], ...dataRows] = nonEmpty;
  return { headers, rows: dataRows };
}

function escapeCell(value: string): string {
  const v = value ?? "";
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function serializeCsv(table: Table): string {
  const lines = [table.headers, ...table.rows].map((r) => r.map(escapeCell).join(","));
  return lines.join("\n");
}
