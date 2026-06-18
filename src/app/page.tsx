"use client";

import { useCallback, useMemo, useState } from "react";
import styles from "./page.module.css";
import { Dropzone } from "@/components/Dropzone";
import { HealthScore } from "@/components/HealthScore";
import { ColumnGrid } from "@/components/ColumnGrid";
import { IssuesPanel } from "@/components/IssuesPanel";
import { DownloadBar } from "@/components/DownloadBar";
import { processCsv, reprocess, cleanTable } from "@/lib/process";
import { ColumnPlan } from "@/lib/validation/engine";
import { ValidationResult, Table } from "@/lib/validation/types";
import { SAMPLE_CSV, SAMPLE_NAME } from "@/lib/sampleData";

interface State {
  table: Table;
  plan: ColumnPlan[];
  result: ValidationResult;
  baseName: string;
}

export default function Home() {
  const [state, setState] = useState<State | null>(null);

  const load = useCallback((text: string, name: string) => {
    const { table, plan, result } = processCsv(text);
    setState({ table, plan, result, baseName: name.replace(/\.csv$/i, "") + "_cleaned" });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const onPlanChange = useCallback((index: number, patch: Partial<ColumnPlan>) => {
    setState((prev) => {
      if (!prev) return prev;
      const plan = prev.plan.map((p) => (p.index === index ? { ...p, ...patch } : p));
      return { ...prev, plan, result: reprocess(prev.table, plan) };
    });
  }, []);

  const cleaned = useMemo(() => (state ? cleanTable(state.table, state.plan) : null), [state]);

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

      {!state ? (
        <div className={styles.uploadWrap}>
          <Dropzone onFile={load} onTrySample={() => load(SAMPLE_CSV, SAMPLE_NAME)} />
        </div>
      ) : (
        <div className={styles.results}>
          <HealthScore
            score={state.result.healthScore}
            summary={state.result.summary}
            rowCount={state.result.rowCount}
            issueCount={state.result.issues.length}
            columnCount={state.result.columns.length}
          />

          <ColumnGrid plan={state.plan} columns={state.result.columns} onPlanChange={onPlanChange} />

          <div>
            <h2 className={styles.sectionTitle}>Issues &amp; suggested fixes</h2>
            <IssuesPanel issues={state.result.issues} />
          </div>

          {cleaned && (
            <DownloadBar cleaned={cleaned} issues={state.result.issues} baseName={state.baseName} onReset={() => setState(null)} />
          )}
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
