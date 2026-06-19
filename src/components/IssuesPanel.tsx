"use client";

import { useMemo, useState } from "react";
import styles from "./IssuesPanel.module.css";
import { CellIssue } from "@/lib/validation/types";

type Filter = "all" | "error" | "fixable";

const PAGE = 50;

interface IssuesPanelProps {
  issues: readonly CellIssue[];
  onEdit: (rowIndex: number, column: string, value: string) => void;
  onFixAll: () => void;
}

export function IssuesPanel({ issues, onEdit, onFixAll }: IssuesPanelProps) {
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
        <p>No issues left. This dataset is onboarding-ready.</p>
      </section>
    );
  }

  const shown = filtered.slice(0, limit);

  return (
    <section aria-label="Issues found">
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist">
          <Tab active={filter === "all"} onClick={() => setFilter("all")} label={`All ${issues.length}`} />
          <Tab active={filter === "error"} onClick={() => setFilter("error")} label={`Errors ${errorCount}`} />
          <Tab active={filter === "fixable"} onClick={() => setFilter("fixable")} label={`Auto-fixable ${fixableCount}`} />
        </div>
        {fixableCount > 0 && (
          <button type="button" className={styles.fixAll} onClick={onFixAll}>
            ⚡ Fix all {fixableCount} auto-fixable
          </button>
        )}
      </div>

      <ul className={styles.list}>
        {shown.map((issue, i) => (
          <IssueRow key={`${issue.rowIndex}-${issue.column}-${i}`} issue={issue} onEdit={onEdit} />
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

function IssueRow({ issue, onEdit }: { issue: CellIssue; onEdit: IssuesPanelProps["onEdit"] }) {
  const [value, setValue] = useState(issue.rawValue);
  const apply = () => {
    if (value !== issue.rawValue) onEdit(issue.rowIndex, issue.column, value);
  };

  return (
    <li className={styles.row}>
      <span className={`${styles.dot} ${styles[issue.severity]}`} aria-hidden />
      <span className={styles.loc}>
        row {issue.rowIndex + 1} · <strong>{issue.column}</strong>
      </span>
      <span className={styles.msg}>{issue.message}</span>

      <div className={styles.editor}>
        <input
          className={styles.input}
          value={value}
          placeholder="(empty)"
          aria-label={`Fix ${issue.column} on row ${issue.rowIndex + 1}`}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          onBlur={apply}
        />
        {issue.suggestedFix !== undefined && issue.suggestedFix !== value && (
          <button
            type="button"
            className={styles.useFix}
            title={`Use suggested fix: ${issue.suggestedFix || "(remove)"}`}
            onClick={() => {
              setValue(issue.suggestedFix!);
              onEdit(issue.rowIndex, issue.column, issue.suggestedFix!);
            }}
          >
            use fix: <code>{issue.suggestedFix || "∅"}</code>
          </button>
        )}
        {issue.suggestedFix === undefined && <span className={styles.manual}>type a value →</span>}
      </div>
    </li>
  );
}

function Tab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="tab" aria-selected={active} className={`${styles.tab} ${active ? styles.tabActive : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}
