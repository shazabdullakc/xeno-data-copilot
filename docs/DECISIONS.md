# Design decisions & tradeoffs

A running log of *why* the build looks the way it does. Doubles as the source
for the assignment's "2–3 line approach & tradeoffs" write-up.

## 1. Client-side, no backend

**Decision:** Parse, validate, clean and chunk entirely in the browser.

**Why:** (a) Client transaction data is sensitive — keeping it on the user's
machine is a real privacy win and a clean talking point. (b) The whole thing
deploys as a static site (one-click host, nothing to scale or secure).

**Tradeoff:** In-browser memory caps practical file size at tens of MB. For
multi-GB enterprise files I'd move parsing to a streaming backend worker —
**deliberately out of scope** for this assignment's data sizes.

## 2. Auto-detection over configuration

**Decision:** The tool infers country and date format from the data instead of
making the user pick.

**Why:** This is the "AI Empowerment" framing and the actual implementation-
engineer pain: you rarely *know* a client's formats up front. Detection that
explains itself ("India, 64% match") builds trust.

**Tradeoff:** Detection can be wrong on tiny/ambiguous columns, so the design
keeps the detected plan overridable (UI exposes it) rather than hard-coded.

## 3. Configurable country rules in one file

**Decision:** All phone rules live in `countries.ts` as plain data.

**Why:** The brief explicitly asks for "configurable country codes." Adding a
country is a one-line data change; no logic edits.

**Tradeoff:** It's a static table, not a full libphonenumber. Good enough for
length + dial-code + leading-digit checks; not carrier-level validation.

## 4. Pure, dependency-free engine

**Decision:** `src/lib/` has zero runtime dependencies, including the CSV parser.

**Why:** Keeps the core testable in isolation, the bundle tiny, and the UI a
thin shell. Easy for a reviewer to read end-to-end.

**Tradeoff:** Our CSV parser is intentionally minimal. If we hit exotic CSV
edge cases at scale we'd swap in PapaParse behind the same `parseCsv` interface.

## 5. Suggest-and-apply fixes, never silently mangle

**Decision:** Fixes are only applied where the correct value is unambiguous
(trim whitespace, strip currency symbols, normalize a valid-length phone to
E.164, standardize a real date to ISO). Genuinely broken values (a 5-digit
phone) are flagged, not invented.

**Why:** An onboarding tool that quietly fabricates data is worse than one that
flags it. Trust > magic.

## What I chose NOT to build

- A backend / database / queue (not needed at this scale; would dilute the demo).
- User-authored validation rules UI (nice-to-have, not core to the story).
- Per-row time-of-day validation (date-level is what the sample data warrants).
