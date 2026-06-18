// Split a large table into smaller CSV chunks, each carrying the header row so
// every chunk is independently openable. The brief asks to "split large CSV
// files into smaller, manageable chunks" — this is that, by row count.

import { Table } from "./validation/types";
import { serializeCsv } from "./csv";

export interface CsvChunk {
  readonly index: number; // 1-based
  readonly filename: string;
  readonly rowCount: number;
  readonly content: string;
}

export const DEFAULT_CHUNK_ROWS = 5000;

export function chunkTable(table: Table, rowsPerChunk = DEFAULT_CHUNK_ROWS, baseName = "cleaned"): CsvChunk[] {
  if (rowsPerChunk <= 0) throw new Error("rowsPerChunk must be positive");

  // Small enough to stay one file — don't fragment needlessly.
  if (table.rows.length <= rowsPerChunk) {
    return [{ index: 1, filename: `${baseName}.csv`, rowCount: table.rows.length, content: serializeCsv(table) }];
  }

  const chunks: CsvChunk[] = [];
  const total = Math.ceil(table.rows.length / rowsPerChunk);
  for (let i = 0; i < total; i++) {
    const slice = table.rows.slice(i * rowsPerChunk, (i + 1) * rowsPerChunk);
    const part: Table = { headers: table.headers, rows: slice };
    chunks.push({
      index: i + 1,
      filename: `${baseName}_part_${i + 1}_of_${total}.csv`,
      rowCount: slice.length,
      content: serializeCsv(part),
    });
  }
  return chunks;
}
