// Client-side file delivery. Builds the cleaned output and triggers a browser
// download — a single CSV when it fits, or a zipped set of chunks when it
// doesn't. Nothing is uploaded anywhere; this all runs in the tab.

import JSZip from "jszip";
import { Table } from "./validation/types";
import { serializeCsv } from "./csv";
import { chunkTable, DEFAULT_CHUNK_ROWS } from "./chunk";

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Download the cleaned table. Chunks into a zip when over the row threshold. */
export async function downloadCleaned(
  cleaned: Table,
  baseName = "cleaned",
  rowsPerChunk = DEFAULT_CHUNK_ROWS
): Promise<{ chunkCount: number }> {
  const chunks = chunkTable(cleaned, rowsPerChunk, baseName);

  if (chunks.length === 1) {
    triggerDownload(new Blob([chunks[0]!.content], { type: "text/csv" }), `${baseName}.csv`);
    return { chunkCount: 1 };
  }

  const zip = new JSZip();
  for (const chunk of chunks) zip.file(chunk.filename, chunk.content);
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, `${baseName}_chunks.zip`);
  return { chunkCount: chunks.length };
}

/** Download just the human-readable issue report as CSV (handy to send a client). */
export function downloadIssueReport(
  issues: readonly { rowIndex: number; column: string; severity: string; message: string; rawValue: string }[],
  baseName = "issues"
): void {
  const report: Table = {
    headers: ["row", "column", "severity", "issue", "raw_value"],
    rows: issues.map((i) => [String(i.rowIndex + 1), i.column, i.severity, i.message, i.rawValue]),
  };
  triggerDownload(new Blob([serializeCsv(report)], { type: "text/csv" }), `${baseName}.csv`);
}
