# Xeno Data Co-pilot

> Hand it a messy client export — it tells you what's wrong in plain English, fixes what it safely can, and hands back an onboarding-ready file.

A data-onboarding co-pilot for transaction datasets (order / product / payment data). Built for **Part 4 — AI Empowerment** of the Xeno Implementation Internship assignment.

It is **not** "a CSV validator." It is framed around the actual implementation-engineer workflow: a client dumps a messy export on you, and you need it clean and loadable *fast*.

---

## What makes it different

| Generic validator | This co-pilot |
| --- | --- |
| Asks you to pick the country | **Auto-detects** the country from the phone data itself |
| Asks you to pick the date format | **Auto-detects** `DD/MM/YYYY` vs `MM/DD/YYYY` by voting across the column |
| "42 rows failed" | **Plain-English, per-cell explanations** + a data **health score** |
| Only flags errors | **Suggests and applies fixes** (trim, normalize phone, standardize dates, strip currency) |
| Uploads your file to a server | **Runs 100% in the browser** — client data never leaves the machine |

That last point is both a product decision (sensitive client data stays private) and an architecture decision (trivial to host, no backend to scale or secure).

---

## How it maps to the assignment brief

| Brief requirement | Where it lives |
| --- | --- |
| Accept order / product / payment datasets | `src/lib/csv.ts` + column auto-detection |
| Phone validation, country-specific, **configurable country codes** | `src/lib/validation/countries.ts` (single source of truth) + `validators/phone.ts` |
| Date & time validation against formats | `validators/date.ts` + `detect/dateFormat.ts` |
| General data integrity / format checks | `validators/email.ts`, `validators/amount.ts`, empty/own-type checks in `engine.ts` |
| Cleaned, validated output file | `cleanTable()` in `engine.ts` + `serializeCsv()` |
| Auto-split large CSVs into chunks | `src/lib/chunk.ts` |
| Configurable & scalable for international data | Add a country = one entry in `countries.ts`; nothing else changes |

---

## Architecture at a glance

```
CSV text
  └─ parseCsv()                      → Table { headers, rows }
       └─ planColumns()              → per-column type + country/date-format detection
            └─ validateTable()       → CellIssue[] + ColumnReport[] + healthScore
            └─ cleanTable()          → Table with suggested fixes applied
                 └─ chunkTable()     → independently-openable CSV chunks
```

The engine (`src/lib/`) is **pure, framework-agnostic TypeScript** with zero runtime dependencies — so it's fully testable on its own and the UI is a thin shell on top of it.

See [`docs/ENGINE.md`](docs/ENGINE.md) for internals and [`docs/DECISIONS.md`](docs/DECISIONS.md) for the tradeoff log.

---

## Run it locally

```bash
npm install
npm run smoke       # runs the engine against samples/messy_transactions.csv
npm run typecheck   # strict TypeScript, zero errors
```

`npm run smoke` prints detected column types, the health score, every issue with its
suggested fix, and the chunked cleaned output — a fast way to see the engine think.

---

## Project layout

```
src/lib/
├── csv.ts                 # dependency-free CSV parse / serialize
├── chunk.ts               # split a large table into manageable CSV chunks
└── validation/
    ├── types.ts           # shared types (the contract everything speaks)
    ├── countries.ts       # CONFIGURABLE country phone rules — add a country here
    ├── engine.ts          # orchestrator: plan → validate → clean
    ├── detect/            # auto-detection: column type, phone country, date format
    ├── validators/        # phone, date, email, amount
    └── fixers/            # (reserved) standalone fix utilities
samples/                   # a realistic messy dataset to demo against
scripts/smoke.ts           # end-to-end sanity check
```

---

## Roadmap (deliberately out of scope for the assignment)

- Streaming parse for multi-GB files via a backend worker (current build is in-browser, ideal up to ~tens of MB)
- User-editable validation rules in the UI
- More countries / locale-aware date+time-of-day validation
