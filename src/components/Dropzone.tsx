"use client";

import { useCallback, useRef, useState } from "react";
import styles from "./Dropzone.module.css";

interface DropzoneProps {
  onFile: (text: string, name: string) => void;
  onTrySample: () => void;
}

export function Dropzone({ onFile, onTrySample }: DropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = useCallback(
    (file: File) => {
      if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
        setError("Please drop a .csv file.");
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = () => onFile(String(reader.result ?? ""), file.name);
      reader.onerror = () => setError("Couldn't read that file.");
      reader.readAsText(file);
    },
    [onFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) readFile(file);
    },
    [readFile]
  );

  return (
    <div>
      <div
        className={`${styles.zone} ${dragging ? styles.dragging : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        aria-label="Upload a CSV file"
      >
        <div className={styles.icon} aria-hidden>
          <span className={styles.iconSheet} />
          <span className={styles.iconArrow}>↓</span>
        </div>
        <p className={styles.lead}>
          Drop a transaction CSV <span className={styles.or}>or click to browse</span>
        </p>
        <p className={styles.hint}>Order, product &amp; payment data — anything your client exported.</p>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className={styles.input}
          onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])}
        />
      </div>

      <div className={styles.footnote}>
        <button type="button" className={styles.sample} onClick={onTrySample}>
          Try it with a messy sample →
        </button>
        <span className={styles.privacy}>🔒 Your file never leaves this browser</span>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
