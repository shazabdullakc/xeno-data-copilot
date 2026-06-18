// Date validation against a known format. Formats are simple token strings so
// they're easy to show the user ("DD/MM/YYYY") and easy to extend.

export type DateFormat =
  | "YYYY-MM-DD"
  | "DD/MM/YYYY"
  | "MM/DD/YYYY"
  | "DD-MM-YYYY"
  | "MM-DD-YYYY"
  | "DD.MM.YYYY";

export const SUPPORTED_FORMATS: readonly DateFormat[] = [
  "YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY", "DD-MM-YYYY", "MM-DD-YYYY", "DD.MM.YYYY",
];

interface Parts { year: number; month: number; day: number }

function sepFor(fmt: DateFormat): string {
  if (fmt.includes("/")) return "/";
  if (fmt.includes(".")) return ".";
  return "-";
}

/** Split a raw value into numeric parts according to a format. Tolerates a trailing time. */
function extract(raw: string, fmt: DateFormat): Parts | null {
  const datePart = raw.trim().split(/[ T]/)[0] ?? ""; // drop any "HH:MM:SS"
  const sep = sepFor(fmt);
  const chunks = datePart.split(sep);
  if (chunks.length !== 3 || chunks.some((c) => c === "" || /\D/.test(c))) return null;
  const order = fmt.split(sep) as ("YYYY" | "MM" | "DD")[];
  const map: Record<"YYYY" | "MM" | "DD", number> = { YYYY: 0, MM: 0, DD: 0 };
  order.forEach((tok, i) => (map[tok] = Number(chunks[i])));
  return { year: map.YYYY, month: map.MM, day: map.DD };
}

function isRealDate({ year, month, day }: Parts): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

export interface DateParse {
  readonly isValid: boolean;
  readonly parts?: Parts;
  readonly reason?: string;
  readonly normalized?: string; // ISO YYYY-MM-DD
}

export function parseDate(raw: string, fmt: DateFormat): DateParse {
  const trimmed = (raw ?? "").trim();
  if (trimmed === "") return { isValid: false, reason: "Empty date" };

  const parts = extract(trimmed, fmt);
  if (!parts) return { isValid: false, reason: `Doesn't match ${fmt}` };
  if (!isRealDate(parts)) {
    return { isValid: false, parts, reason: `Not a real calendar date (${fmt})` };
  }
  const iso = `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  return { isValid: true, parts, normalized: iso };
}
