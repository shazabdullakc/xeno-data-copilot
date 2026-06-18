"use client";

import { useState } from "react";
import styles from "./DownloadBar.module.css";
import { Table, CellIssue } from "@/lib/validation/types";
import { downloadCleaned, downloadIssueReport } from "@/lib/download";
import { DEFAULT_CHUNK_ROWS } from "@/lib/chunk";

interface DownloadBarProps {
  cleaned: Table;
  issues: readonly CellIssue[];
  baseName: string;
  onReset: () => void;
}

export function DownloadBar({ cleaned, issues, baseName, onReset }: DownloadBarProps) {
  const [chunkRows, setChunkRows] = useState(DEFAULT_CHUNK_ROWS);
  const [busy, setBusy] = useState(false);
  const willChunk = cleaned.rows.length > chunkRows;
  const chunkCount = Math.max(1, Math.ceil(cleaned.rows.length / chunkRows));

  const handleDownload = async () => {
    setBusy(true);
    try {
      await downloadCleaned(cleaned, baseName, chunkRows);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.bar}>
      <div className={styles.left}>
        <h3 className={styles.title}>Onboarding-ready output</h3>
        <p className={styles.note}>
          All fixable issues applied. {willChunk ? `Will export as ${chunkCount} chunks (zipped).` : "Exports as a single CSV."}
        </p>
      </div>

      <div className={styles.controls}>
        <label className={styles.chunk}>
          Rows / chunk
          <input
            type="number"
            min={100}
            step={100}
            value={chunkRows}
            onChange={(e) => setChunkRows(Math.max(100, Number(e.target.value) || DEFAULT_CHUNK_ROWS))}
          />
        </label>

        <button type="button" className={styles.secondary} onClick={() => downloadIssueReport(issues, `${baseName}_issues`)} disabled={issues.length === 0}>
          Issue report
        </button>

        <button type="button" className={styles.primary} onClick={handleDownload} disabled={busy}>
          {busy ? "Preparing…" : willChunk ? `Download ${chunkCount} chunks` : "Download clean CSV"}
        </button>

        <button type="button" className={styles.ghost} onClick={onReset}>
          New file
        </button>
      </div>
    </section>
  );
}
