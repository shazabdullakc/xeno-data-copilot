# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [0.1.0] — Engine foundation

The validation engine, proven end-to-end. No UI yet.

### Added
- **CSV layer** (`src/lib/csv.ts`): dependency-free parse/serialize with quoted
  fields, escaped quotes, and CRLF handling.
- **Configurable country rules** (`src/lib/validation/countries.ts`): India,
  Singapore, US, UK, UAE, Australia — add a country in one line.
- **Validators**: country-aware phone (`validators/phone.ts`), date with real-
  calendar checks (`validators/date.ts`), email, and amount.
- **Auto-detection** (`src/lib/validation/detect/`): column semantic type,
  phone country, and date format (incl. `DD/MM` vs `MM/DD` disambiguation).
- **Engine** (`src/lib/validation/engine.ts`): `planColumns`, `validateTable`
  (issues + per-column reports + health score), and `cleanTable`.
- **Chunking** (`src/lib/chunk.ts`): split large tables into independently-
  openable CSV chunks.
- **Sample dataset** (`samples/messy_transactions.csv`) exercising every failure
  mode, plus an end-to-end smoke test (`scripts/smoke.ts`).
- **Docs**: README, `docs/ENGINE.md`, `docs/DECISIONS.md`.

### Verified
- `npm run typecheck` — strict TypeScript, zero errors.
- `npm run smoke` — detects all 8 columns, scores the sample 87/100, surfaces
  19 issues with suggested fixes, and emits 2 cleaned chunks.

## [Unreleased]
- Next.js UI shell: drag-drop upload, health report, fix preview, downloads.
