"use client";

import styles from "./ColumnGrid.module.css";
import { ColumnPlan } from "@/lib/validation/engine";
import { ColumnReport } from "@/lib/validation/types";
import { listCountries } from "@/lib/validation/countries";
import { SUPPORTED_FORMATS } from "@/lib/validation/validators/date";

interface ColumnGridProps {
  plan: ColumnPlan[];
  columns: readonly ColumnReport[];
  onPlanChange: (index: number, patch: Partial<ColumnPlan>) => void;
}

const TYPE_ICON: Record<string, string> = {
  phone: "☎",
  date: "🗓",
  email: "✉",
  amount: "₹",
  id: "#",
  payment_mode: "💳",
  text: "Aa",
  unknown: "?",
};

export function ColumnGrid({ plan, columns, onPlanChange }: ColumnGridProps) {
  const reportFor = (name: string) => columns.find((c) => c.name === name);

  return (
    <section aria-label="Detected columns">
      <header className={styles.head}>
        <h2 className={styles.title}>What we found in your data</h2>
        <p className={styles.sub}>Auto-detected. Override anything that looks off — results update live.</p>
      </header>

      <div className={styles.grid}>
        {plan.map((p) => {
          const r = reportFor(p.name);
          const clean = (r?.issueCount ?? 0) === 0;
          return (
            <article key={p.index} className={styles.cell}>
              <div className={styles.cellTop}>
                <span className={styles.typeIcon} aria-hidden>
                  {TYPE_ICON[p.type] ?? "?"}
                </span>
                <div className={styles.names}>
                  <span className={styles.colName} title={p.name}>
                    {p.name}
                  </span>
                  <span className={styles.colType}>{p.type.replace("_", " ")}</span>
                </div>
                <span className={`${styles.status} ${clean ? styles.ok : styles.flag}`}>
                  {clean ? "clean" : `${r?.issueCount} issue${r?.issueCount === 1 ? "" : "s"}`}
                </span>
              </div>

              <div className={styles.confidence} aria-label={`Detection confidence ${Math.round(p.confidence * 100)}%`}>
                <div className={styles.confBar} style={{ width: `${Math.round(p.confidence * 100)}%` }} />
              </div>

              {p.type === "phone" && (
                <label className={styles.override}>
                  Country
                  <select
                    value={p.country ?? "IN"}
                    onChange={(e) => onPlanChange(p.index, { country: e.target.value, detail: undefined })}
                  >
                    {listCountries().map((c) => (
                      <option key={c.iso} value={c.iso}>
                        {c.name} ({c.dialCode})
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {p.type === "date" && (
                <label className={styles.override}>
                  Format
                  <select
                    value={p.dateFormat ?? "YYYY-MM-DD"}
                    onChange={(e) => onPlanChange(p.index, { dateFormat: e.target.value as ColumnPlan["dateFormat"], detail: e.target.value })}
                  >
                    {SUPPORTED_FORMATS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {p.type !== "phone" && p.type !== "date" && p.detail && (
                <p className={styles.detail}>{p.detail}</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
