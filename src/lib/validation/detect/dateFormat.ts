// Infer a column's date format from its values. The hard case is DD/MM vs
// MM/DD, which look identical until some value has a day > 12. We vote across
// the whole column: a format is only viable if it parses (nearly) every value,
// and we prefer the one with the most real disambiguating evidence.

import { DateFormat, SUPPORTED_FORMATS, parseDate } from "../validators/date";

export interface DateFormatGuess {
  readonly format: DateFormat;
  readonly confidence: number; // share of non-empty samples it parses
}

const SAMPLE_LIMIT = 200;

export function detectDateFormat(values: readonly string[]): DateFormatGuess | null {
  const samples = values.map((v) => (v ?? "").trim()).filter((v) => v !== "").slice(0, SAMPLE_LIMIT);
  if (samples.length === 0) return null;

  let best: DateFormatGuess | null = null;

  for (const fmt of SUPPORTED_FORMATS) {
    let ok = 0;
    for (const v of samples) if (parseDate(v, fmt).isValid) ok += 1;
    const confidence = ok / samples.length;
    // Tie-break toward the first listed (ISO, then DD/MM — sensible India default).
    if (!best || confidence > best.confidence) best = { format: fmt, confidence };
  }

  // Below this, it's probably not a date column at all.
  return best && best.confidence >= 0.6 ? best : null;
}
