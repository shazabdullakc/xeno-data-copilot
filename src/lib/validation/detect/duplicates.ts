// Row-level integrity check: find exact-duplicate rows. The first occurrence is
// kept; every later identical row is reported. Comparison is trimmed and
// case-insensitive so "Cash" and " cash " count as the same transaction.

import { Table } from "../types";

const SEP = ""; // unit separator — won't collide with real cell content

function rowKey(row: readonly string[]): string {
  return row.map((c) => (c ?? "").trim().toLowerCase()).join(SEP);
}

/** Indices of rows that are exact duplicates of an earlier row. */
export function findDuplicateRows(table: Table): number[] {
  const seen = new Set<string>();
  const duplicates: number[] = [];
  table.rows.forEach((row, index) => {
    const key = rowKey(row);
    if (seen.has(key)) duplicates.push(index);
    else seen.add(key);
  });
  return duplicates;
}
