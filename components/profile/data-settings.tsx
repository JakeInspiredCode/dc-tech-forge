"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { BRAND } from "@/lib/brand";
import {
  backupFilename,
  buildBackup,
  parseBackup,
  restoreBackup,
  type BackupFile,
} from "@/lib/data/backup";
import { hasUserActivity } from "@/lib/data/activity";
import { flushPersistenceNow } from "@/lib/data/persistence";
import { isSampleDataLoaded } from "@/lib/data/sample-flag";
import { subscribe } from "@/lib/data/store";
import { downloadJSON } from "@/lib/import-export";

// Matches the Settings tab it renders inside (app/profile/page.tsx).
const accentColor = "#e0e4ec";
const cyan = "var(--color-v2-cyan)";
const danger = "#ef4444";
const MAX_FILE_BYTES = 5_000_000;

type Pending =
  | { kind: "restore"; backup: BackupFile }
  | { kind: "sample" }
  | null;

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[11px] tracking-widest uppercase mb-3"
      style={{ color: accentColor, fontFamily: "'Chakra Petch', sans-serif", opacity: 0.7 }}
    >
      {children}
    </h2>
  );
}

function ActionButton({
  onClick,
  children,
  tone = accentColor,
  disabled = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  tone?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-2 rounded-lg text-[11px] display-font tracking-wider uppercase transition-all duration-200 disabled:cursor-not-allowed"
      style={{
        color: tone,
        background: `color-mix(in srgb, ${tone} 6%, transparent)`,
        border: `1px solid color-mix(in srgb, ${tone} 35%, transparent)`,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

function describe(backup: BackupFile): string {
  const date = backup.exportedAt ? new Date(backup.exportedAt).toLocaleDateString() : "an unknown date";
  const reviews = backup.data.forgeReviews.length;
  const missions = backup.data.forgeMissionProgress.filter((m) => m.status === "accomplished").length;
  return `Backup from ${date}: ${reviews} card reviews, ${missions} missions completed${
    backup.sampleData ? " (sample data)" : ""
  }.`;
}

export default function DataSettings() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);
  const sampleLoaded = useSyncExternalStore(subscribe, isSampleDataLoaded, () => false);

  const clearMessages = () => {
    setStatus(null);
    setError(null);
  };

  const exportProgress = () => {
    clearMessages();
    const name = backupFilename();
    downloadJSON(JSON.stringify(buildBackup()), name);
    setStatus(`Saved ${name}`);
  };

  const onFileChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow choosing the same file again
    if (!file) return;
    clearMessages();
    if (file.size > MAX_FILE_BYTES) {
      setError("That file is too large to be a backup.");
      return;
    }
    const result = parseBackup(await file.text());
    if (result.ok) setPending({ kind: "restore", backup: result.backup });
    else setError(result.error);
  };

  const requestSample = async () => {
    clearMessages();
    if (hasUserActivity()) setPending({ kind: "sample" });
    else await loadSample(false);
  };

  const loadSample = async (replaceExisting: boolean) => {
    setBusy(true);
    const { loadSampleData } = await import("@/lib/data/sample-data");
    await loadSampleData({ replaceExisting });
    flushPersistenceNow();
    window.location.reload();
  };

  const confirmPending = async () => {
    if (pending?.kind === "restore") {
      setBusy(true);
      restoreBackup(pending.backup);
      window.location.reload();
    } else if (pending?.kind === "sample") {
      await loadSample(true);
    }
  };

  return (
    <>
      <div>
        <SectionHeading>Your data</SectionHeading>
        <div className="space-y-3">
          <p className="text-[11px] leading-relaxed" style={{ color: "#e6ebf5" }}>
            {BRAND.name} has no accounts — your progress lives only in this browser. Export a backup
            to move it to another device or browser, or just to keep a copy.
          </p>
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={exportProgress} tone={cyan} disabled={busy}>
              Export progress
            </ActionButton>
            <ActionButton onClick={() => fileInput.current?.click()} disabled={busy}>
              Import progress…
            </ActionButton>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              onChange={onFileChosen}
              className="hidden"
              aria-label="Choose a progress backup file to import"
            />
          </div>
        </div>
      </div>

      <div>
        <SectionHeading>Sample progress</SectionHeading>
        <div className="space-y-3">
          <p className="text-[11px] leading-relaxed" style={{ color: "#e6ebf5" }}>
            {sampleLoaded
              ? "This account is filled with made-up progress. Use “Start fresh” in the banner above, or Reset below, to clear it."
              : "Fill this account with a few weeks of made-up progress to see how the app looks in use."}
          </p>
          {!sampleLoaded && (
            <ActionButton onClick={requestSample} disabled={busy}>
              Load sample progress
            </ActionButton>
          )}
        </div>
      </div>

      {pending && (
        <div
          role="alertdialog"
          aria-label="Confirm replacing your progress"
          className="rounded-lg p-3 sm:p-4 space-y-3"
          style={{ background: `${danger}08`, border: `1px solid ${danger}28` }}
        >
          <p className="text-[11px] leading-relaxed" style={{ color: "#e6ebf5" }}>
            {pending.kind === "restore" ? describe(pending.backup) : "This loads made-up progress."}{" "}
            It <strong style={{ color: danger }}>replaces everything</strong> currently saved in this
            browser. Export a backup first if you want to keep it.
          </p>
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={confirmPending} tone={danger} disabled={busy}>
              Replace and reload
            </ActionButton>
            <ActionButton onClick={() => setPending(null)} disabled={busy}>
              Cancel
            </ActionButton>
          </div>
        </div>
      )}

      {status && (
        <p role="status" className="text-[11px]" style={{ color: cyan }}>
          {status}
        </p>
      )}
      {error && (
        <p role="alert" className="text-[11px]" style={{ color: danger }}>
          {error}
        </p>
      )}
    </>
  );
}
