"use client";

import { useCallback, useMemo, useState } from "react";
import styles from "./page.module.css";
import { Dropzone } from "@/components/Dropzone";
import { HealthScore } from "@/components/HealthScore";
import { ColumnGrid } from "@/components/ColumnGrid";
import { IssuesPanel } from "@/components/IssuesPanel";
import { DownloadBar } from "@/components/DownloadBar";
import { processCsv, applyOverrides, cleanTable, reprocess, Overrides } from "@/lib/process";
import { ColumnPlan } from "@/lib/validation/engine";
import { Table } from "@/lib/validation/types";
import { SAMPLE_CSV, SAMPLE_NAME } from "@/lib/sampleData";

interface State {
  table: Table; // the original parsed file (never mutated)
  plan: ColumnPlan[];
  overrides: Overrides; // manual cell fixes, keyed "row:col"
  baseName: string;
  baseline: number; // health score of the untouched file, for the delta
}

export default function Home() {
  const [state, setState] = useState<State | null>(null);

  const load = useCallback((text: string, name: string) => {
    const { table, plan, result } = processCsv(text);
    setState({
      table,
      plan,
      overrides: {},
      baseName: name.replace(/\.csv$/i, "") + "_cleaned",
      baseline: result.healthScore,
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const onPlanChange = useCallback((index: number, patch: Partial<ColumnPlan>) => {
    setState((prev) => (prev ? { ...prev, plan: prev.plan.map((p) => (p.index === index ? { ...p, ...patch } : p)) } : prev));
  }, []);

  // Manual edit: stash the typed value as an override on (row, column).
  const onEdit = useCallback((rowIndex: number, column: string, value: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const col = prev.plan.find((p) => p.name === column);
      if (!col) return prev;
      return { ...prev, overrides: { ...prev.overrides, [`${rowIndex}:${col.index}`]: value } };
    });
  }, []);

  // Everything below is derived — raw table + plan + overrides → live result.
  const effective = useMemo(() => (state ? applyOverrides(state.table, state.overrides) : null), [state]);
  const result = useMemo(() => (effective && state ? reprocess(effective, state.plan) : null), [effective, state]);
  const cleaned = useMemo(() => (effective && state ? cleanTable(effective, state.plan) : null), [effective, state]);
  const editCount = state ? Object.keys(state.overrides).length : 0;

  // Apply every machine-safe fix at once — turns each auto-fixable issue into an override.
  const onFixAll = useCallback(() => {
    setState((prev) => {
      if (!prev || !result) return prev;
      const batch: Overrides = {};
      for (const issue of result.issues) {
        if (issue.suggestedFix === undefined) continue;
        const col = prev.plan.find((p) => p.name === issue.column);
        if (col) batch[`${issue.rowIndex}:${col.index}`] = issue.suggestedFix;
      }
      return { ...prev, overrides: { ...prev.overrides, ...batch } };
    });
  }, [result]);

  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <span className={styles.kicker}>Data onboarding co-pilot</span>
        <h1 className={styles.headline}>
          Messy client export in.<br />
          <span className={styles.accent}>Onboarding-ready file out.</span>
        </h1>
        <p className={styles.tagline}>
          Drop a transaction CSV. It auto-detects each column&apos;s format, explains every problem in plain
          English, fixes what it safely can, and splits large files into chunks — all in your browser.
        </p>
      </header>

      {!state || !result || !cleaned ? (
        <div className={styles.uploadWrap}>
          <Dropzone onFile={load} onTrySample={() => load(SAMPLE_CSV, SAMPLE_NAME)} />
        </div>
      ) : (
        <div className={styles.results}>
          <HealthScore
            score={result.healthScore}
            baseline={state.baseline}
            summary={result.summary}
            rowCount={result.rowCount}
            issueCount={result.issues.length}
            columnCount={result.columns.length}
          />

          <ColumnGrid plan={state.plan} columns={result.columns} onPlanChange={onPlanChange} />

          <div>
            <h2 className={styles.sectionTitle}>
              Issues &amp; fixes
              {editCount > 0 && <span className={styles.editBadge}>{editCount} manually edited</span>}
            </h2>
            <IssuesPanel issues={result.issues} onEdit={onEdit} onFixAll={onFixAll} />
          </div>

          <DownloadBar cleaned={cleaned} issues={result.issues} baseName={state.baseName} onReset={() => setState(null)} />
        </div>
      )}

      <footer className={styles.footer}>
        <span>Runs entirely client-side · no upload, no backend</span>
        <a href="https://github.com/shazabdullakc/xeno-data-copilot" target="_blank" rel="noopener noreferrer">
          Source &amp; docs ↗
        </a>
      </footer>
    </main>
  );
}
