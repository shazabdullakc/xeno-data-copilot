"use client";

import { useMemo, useState } from "react";
import styles from "./IssuesPanel.module.css";
import { CellIssue } from "@/lib/validation/types";

type Filter = "all" | "error" | "fixable";

const PAGE = 50;

export function IssuesPanel({ issues }: { issues: readonly CellIssue[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [limit, setLimit] = useState(PAGE);

  const fixableCount = useMemo(() => issues.filter((i) => i.suggestedFix !== undefined).length, [issues]);
  const errorCount = useMemo(() => issues.filter((i) => i.severity === "error").length, [issues]);

  const filtered = useMemo(() => {
    if (filter === "error") return issues.filter((i) => i.severity === "error");
    if (filter === "fixable") return issues.filter((i) => i.suggestedFix !== undefined);
    return issues;
  }, [issues, filter]);

  if (issues.length === 0) {
    return (
      <section className={styles.empty}>
        <span className={styles.emptyMark}>✓</span>
        <p>No issues found. This dataset is onboarding-ready.</p>
      </section>
    );
  }

  const shown = filtered.slice(0, limit);

  return (
    <section aria-label="Issues found">
      <div className={styles.tabs} role="tablist">
        <Tab active={filter === "all"} onClick={() => setFilter("all")} label={`All ${issues.length}`} />
        <Tab active={filter === "error"} onClick={() => setFilter("error")} label={`Errors ${errorCount}`} />
        <Tab active={filter === "fixable"} onClick={() => setFilter("fixable")} label={`Auto-fixable ${fixableCount}`} />
      </div>

      <ul className={styles.list}>
        {shown.map((issue, i) => (
          <li key={`${issue.rowIndex}-${issue.column}-${i}`} className={styles.row}>
            <span className={`${styles.dot} ${styles[issue.severity]}`} aria-hidden />
            <span className={styles.loc}>
              row {issue.rowIndex + 1} · <strong>{issue.column}</strong>
            </span>
            <span className={styles.msg}>{issue.message}</span>
            <span className={styles.raw} title={issue.rawValue || "(empty)"}>
              {issue.rawValue || "(empty)"}
            </span>
            {issue.suggestedFix !== undefined ? (
              <span className={styles.fix}>
                → <code>{issue.suggestedFix || "(removed)"}</code>
              </span>
            ) : (
              <span className={styles.noFix}>needs manual review</span>
            )}
          </li>
        ))}
      </ul>

      {limit < filtered.length && (
        <button type="button" className={styles.more} onClick={() => setLimit((l) => l + PAGE)}>
          Show {Math.min(PAGE, filtered.length - limit)} more ({filtered.length - limit} hidden)
        </button>
      )}
    </section>
  );
}

function Tab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="tab" aria-selected={active} className={`${styles.tab} ${active ? styles.tabActive : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}
