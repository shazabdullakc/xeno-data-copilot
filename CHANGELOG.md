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

## [0.2.0] — UI shell

A complete, deployable product on top of the engine.

### Added
- **Next.js 15 + React 19 app** (App Router, static export — no backend).
- **Design system** (`globals.css`): "light editorial data instrument" — oklch
  tokens, serif/sans pairing, layered depth, semantic data colors, reduced-motion
  support. Intentionally not a stock template look.
- **Dropzone**: drag-drop / browse / "try a messy sample", with the
  "file never leaves your browser" privacy cue.
- **HealthScore**: animated SVG score ring + plain-English summary + row/column/
  issue stats.
- **ColumnGrid**: shows every auto-detected column type with a confidence bar;
  phone country and date format are overridable and re-validate live.
- **IssuesPanel**: filterable (all / errors / auto-fixable) per-cell issue list
  with raw value → suggested fix, paginated.
- **DownloadBar**: download cleaned CSV (auto-zips into chunks past a row
  threshold), configurable chunk size, and a separate issue-report export.
- **Browser download + zip** (`src/lib/download.ts`) and client-side processing
  orchestration (`src/lib/process.ts`), with the sample inlined for static build.

### Verified
- `npm run build` — compiles, type-checks, static-exports; 146 kB first load JS.

## [Unreleased]
- Deploy to a public URL; record the 2-minute walkthrough.
