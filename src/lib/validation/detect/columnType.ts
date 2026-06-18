// Infer the semantic type of a column from its header name + a sample of its
// values. Header keywords give a strong prior; the values confirm or override.

import { FieldType } from "../types";

interface Scored { type: FieldType; confidence: number }

const HEADER_HINTS: ReadonlyArray<[RegExp, FieldType]> = [
  [/phone|mobile|contact|whatsapp|cell/i, "phone"],
  [/e?-?mail/i, "email"],
  [/date|time|signup|created|ordered|timestamp/i, "date"],
  [/amount|price|total|cost|value|revenue|paid/i, "amount"],
  [/payment|pay.?mode|method|channel/i, "payment_mode"],
  [/\bid\b|_id|sku|code|number|order.?no/i, "id"],
];

const RX = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  amount: /^[+-]?[\d,]*\.?\d+$/,
  dateish: /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/,
  phoneish: /^[+()\d][\d\s()+-]{6,}$/,
};

function matchRate(samples: readonly string[], rx: RegExp): number {
  if (samples.length === 0) return 0;
  let hits = 0;
  for (const s of samples) if (rx.test(s)) hits += 1;
  return hits / samples.length;
}

export function detectColumnType(header: string, values: readonly string[]): Scored {
  const samples = values.map((v) => (v ?? "").trim()).filter((v) => v !== "").slice(0, 200);

  // Header prior.
  let headerType: FieldType = "unknown";
  for (const [rx, type] of HEADER_HINTS) {
    if (rx.test(header)) { headerType = type; break; }
  }

  // Value evidence.
  const rates: Record<string, number> = {
    email: matchRate(samples, RX.email),
    amount: matchRate(samples, RX.amount),
    date: matchRate(samples, RX.dateish),
    phone: matchRate(samples, RX.phoneish),
  };

  // If values strongly say one thing, trust them over a vague header.
  const valueBest = Object.entries(rates).sort((a, b) => b[1] - a[1])[0];
  if (valueBest && valueBest[1] >= 0.8) {
    const vt = valueBest[0] as FieldType;
    if (vt === headerType) return { type: vt, confidence: Math.min(1, 0.6 + valueBest[1] * 0.4) };
    if (headerType === "unknown") return { type: vt, confidence: valueBest[1] };
  }

  if (headerType !== "unknown") return { type: headerType, confidence: 0.75 };
  if (valueBest && valueBest[1] >= 0.6) return { type: valueBest[0] as FieldType, confidence: valueBest[1] };
  return { type: "text", confidence: 0.3 };
}
