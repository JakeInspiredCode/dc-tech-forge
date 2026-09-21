"use client";

import { useState } from "react";
import Link from "next/link";
import ActionButton from "@/components/ui/action-button";
import { backupFilename, buildBackup } from "@/lib/data/backup";
import { resetPersistedData } from "@/lib/data/persistence";
import { downloadJSON } from "@/lib/import-export";

// The one error boundary screen (app/error.tsx). All progress lives in this
// browser, so a page that crashes on every load usually means a damaged saved
// record — and "Try again" alone would leave that person stuck for good. So it
// also offers the way out: save a backup, then reset.
export default function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [backupNote, setBackupNote] = useState<string | null>(null);

  const saveBackup = () => {
    try {
      downloadJSON(JSON.stringify(buildBackup()), backupFilename());
      setBackupNote("Backup downloaded.");
    } catch {
      setBackupNote("A backup could not be built from the saved data.");
    }
  };

  const resetEverything = () => {
    resetPersistedData();
    window.location.assign("/");
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div role="alert" className="max-w-md w-full text-center glass-panel rounded-lg p-8">
        <h1 className="display-font text-lg text-v2-text mb-2">Something went wrong</h1>
        <p className="text-sm text-v2-text-dim mb-6 break-words">
          {error.message || "This page hit an unexpected error."}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <ActionButton onClick={reset}>Try again</ActionButton>
          <Link
            href="/"
            className="inline-flex items-center justify-center max-md:min-h-[44px] px-4 py-2 text-sm rounded text-v2-text-dim hover:text-v2-text hover:bg-v2-bg-elevated transition-colors"
          >
            Back to the Galaxy Map
          </Link>
        </div>

        <div className="mt-8 pt-5 border-t border-v2-border text-left">
          <p className="text-xs text-v2-text-muted leading-relaxed mb-3">
            Keeps happening? Your progress is stored only in this browser, and a damaged record can break a page
            every time it loads. Save a backup first, then reset.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton variant="secondary" size="sm" onClick={saveBackup}>
              Download a backup
            </ActionButton>
            {confirming ? (
              <>
                <ActionButton variant="secondary" size="sm" onClick={resetEverything}>
                  Yes, erase everything
                </ActionButton>
                <ActionButton variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                  Cancel
                </ActionButton>
              </>
            ) : (
              <ActionButton variant="ghost" size="sm" onClick={() => setConfirming(true)}>
                Reset local data…
              </ActionButton>
            )}
          </div>
          <p role="status" className="text-xs text-v2-text-dim mt-2 min-h-[1rem]">
            {confirming ? "This erases all progress in this browser. It cannot be undone." : backupNote}
          </p>
        </div>
      </div>
    </div>
  );
}
