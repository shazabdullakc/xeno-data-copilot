// Smoke test: prove the engine end-to-end against the messy sample.
// Run with `npm run smoke`. Not a unit suite — a fast, readable sanity check.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseCsv, serializeCsv } from "../src/lib/csv.ts";
import { chunkTable } from "../src/lib/chunk.ts";
import { planColumns, validateTable, cleanTable } from "../src/lib/validation/engine.ts";

const here = dirname(fileURLToPath(import.meta.url));
// Optional CLI arg: a path to any CSV. Defaults to the bundled messy sample.
const arg = process.argv[2];
const csvPath = arg ? (arg.startsWith("/") ? arg : join(process.cwd(), arg)) : join(here, "../samples/messy_transactions.csv");
const csv = readFileSync(csvPath, "utf8");
console.log(`Source: ${csvPath}`);
const table = parseCsv(csv);

console.log(`\nParsed ${table.rows.length} rows, ${table.headers.length} columns\n`);

const plan = planColumns(table);
console.log("Detected columns:");
for (const p of plan) console.log(`  • ${p.name.padEnd(16)} → ${p.type.padEnd(13)} ${p.detail ?? ""}`);

const result = validateTable(table, plan);
console.log(`\nHealth score: ${result.healthScore}/100`);
console.log(`Summary: ${result.summary}\n`);

console.log("Issues:");
for (const i of result.issues) {
  const fix = i.suggestedFix !== undefined ? `  ⇒ fix: "${i.suggestedFix}"` : "";
  console.log(`  row ${i.rowIndex + 1} [${i.column}] ${i.severity}: ${i.message} (raw: "${i.rawValue}")${fix}`);
}

console.log(
  `\nDuplicate rows: ${result.duplicateRows.length}` +
    (result.duplicateRows.length ? ` (rows ${result.duplicateRows.map((r) => r + 1).join(", ")})` : "")
);

const cleaned = cleanTable(table, plan);
console.log(`Cleaned row count: ${cleaned.rows.length} (from ${table.rows.length} — duplicates dropped)`);
const chunks = chunkTable(cleaned, 10, "cleaned_transactions");
console.log(`\nCleaned output → ${chunks.length} chunk(s): ${chunks.map((c) => c.filename).join(", ")}`);
console.log("\nFirst 3 cleaned rows:");
console.log(serializeCsv({ headers: cleaned.headers, rows: cleaned.rows.slice(0, 3) }));
console.log();
