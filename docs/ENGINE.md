# Engine internals

The validation engine is pure TypeScript under `src/lib/` with **no runtime
dependencies**. The UI (added later) is a thin shell that calls these functions.
This doc is the reference for future work on the engine.

## Data flow

1. **`parseCsv(text)`** → `Table { headers, rows }`. Handles quoted fields,
   embedded commas, escaped quotes (`""`), and CRLF. No external CSV lib.
2. **`planColumns(table)`** → `ColumnPlan[]`. One pass per column:
   - `detectColumnType(header, values)` — header keyword prior, confirmed/overridden
     by how well the values match each type's regex.
   - For `phone` columns: `detectPhoneCountry(values)` scores every configured
     country by how many values it validates; highest wins.
   - For `date` columns: `detectDateFormat(values)` votes each supported format
     across the column. `DD/MM` vs `MM/DD` is disambiguated by values where the
     day component is > 12.
3. **`validateTable(table, plan?)`** → `ValidationResult`. Walks every cell,
   runs the type-appropriate validator, collects `CellIssue`s, builds per-column
   reports, and computes a health score.
4. **`cleanTable(table, plan?)`** → `Table`. Re-runs validation and substitutes
   each cell with its `suggestedFix` when one exists. Idempotent.
5. **`chunkTable(table, rowsPerChunk, baseName)`** → `CsvChunk[]`. Each chunk
   repeats the header row so it opens independently.

## Health score

```
errorWeight = Σ (error → 1.0, warning/info → 0.4)
healthScore = round(100 − errorWeight / totalCells × 100)
```

Errors (invalid phone, impossible date, malformed email) weigh more than
warnings (missing optional value, negative amount). Score is clamped to 0–100.

## Severity model

| Severity | Meaning | Examples |
| --- | --- | --- |
| `error` | Breaks downstream loading | wrong phone length, non-calendar date, malformed email |
| `warning` | Loadable but suspect | missing value in a typed column, negative amount |
| `info` | Reserved for non-blocking notes | — |

## Adding a country

Add one entry to `COUNTRY_RULES` in `src/lib/validation/countries.ts`:

```ts
FR: { iso: "FR", name: "France", dialCode: "+33", nationalDigits: 9, validStartDigits: ["6", "7"] },
```

Detection, validation, and normalization pick it up automatically — no other
file changes.

## Adding a validator / field type

1. Add the type to `FieldType` in `types.ts`.
2. Add a `validators/<type>.ts` exporting a `parse<Type>(raw)` that returns
   `{ isValid, reason?, normalized? }`.
3. Wire a `case` into `validateCell()` in `engine.ts`.
4. Add header/value detection hints in `detect/columnType.ts`.

## Testing

`scripts/smoke.ts` runs the full pipeline against `samples/messy_transactions.csv`
and prints detection, issues, fixes, and chunk output. Run with `npm run smoke`.
The sample intentionally contains every failure mode (wrong-length phones,
`MM/DD` vs `DD/MM`, impossible dates like `2025-04-31`, `@@`, spaces, negatives,
missing cells, mixed countries).
