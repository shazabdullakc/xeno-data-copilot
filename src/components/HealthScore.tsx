"use client";

import styles from "./HealthScore.module.css";

interface HealthScoreProps {
  score: number; // 0..100
  baseline?: number; // score of the untouched file; shows a "+N" delta as you fix
  summary: string;
  rowCount: number;
  issueCount: number;
  columnCount: number;
  duplicateCount: number;
}

function tone(score: number): { color: string; label: string } {
  if (score >= 90) return { color: "var(--good)", label: "Healthy" };
  if (score >= 70) return { color: "var(--warn)", label: "Needs cleanup" };
  return { color: "var(--bad)", label: "Needs attention" };
}

export function HealthScore({ score, baseline, summary, rowCount, issueCount, columnCount, duplicateCount }: HealthScoreProps) {
  const { color, label } = tone(score);
  const delta = baseline !== undefined ? score - baseline : 0;
  const R = 52;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - score / 100);

  return (
    <section className={styles.card} aria-label="Data health score">
      <div className={styles.ringWrap}>
        <svg viewBox="0 0 120 120" className={styles.ring} role="img" aria-label={`Health score ${score} of 100`}>
          <circle cx="60" cy="60" r={R} className={styles.track} />
          <circle
            cx="60"
            cy="60"
            r={R}
            className={styles.value}
            style={{ stroke: color, strokeDasharray: C, strokeDashoffset: offset }}
          />
        </svg>
        <div className={styles.center}>
          <span className={styles.number} style={{ color }}>
            {score}
          </span>
          <span className={styles.outOf}>/ 100</span>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.badgeRow}>
          <span className={styles.badge} style={{ background: color }}>
            {label}
          </span>
          {delta > 0 && (
            <span className={styles.delta} aria-label={`Improved by ${delta} points from ${baseline}`}>
              ▲ +{delta} from {baseline}
            </span>
          )}
        </div>
        <p className={styles.summary}>{summary}</p>
        <dl className={styles.stats}>
          <div>
            <dt>Rows</dt>
            <dd>{rowCount.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Columns</dt>
            <dd>{columnCount}</dd>
          </div>
          <div>
            <dt>Issues</dt>
            <dd>{issueCount.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Duplicates</dt>
            <dd>{duplicateCount.toLocaleString()}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
