"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { resetPersistedData } from "@/lib/data/persistence";
import { isSampleDataLoaded } from "@/lib/data/sample-flag";
import { subscribe } from "@/lib/data/store";

// Shown on every page while the account holds sample progress, so nobody
// mistakes a made-up streak for a real person's — and so there is always a
// one-click way out of it.
export default function SampleDataBanner() {
  // The flag is set at the start of a sample load, which then mutates the
  // store; re-reading on store changes is what makes the banner appear
  // without a reload.
  const visible = useSyncExternalStore(subscribe, isSampleDataLoaded, () => false);
  const [confirming, setConfirming] = useState(false);

  // Full-height screens size themselves from --chrome-h (see globals.css).
  useEffect(() => {
    document.documentElement.classList.toggle("has-sample-banner", visible);
    return () => document.documentElement.classList.remove("has-sample-banner");
  }, [visible]);

  if (!visible) return null;

  const startFresh = () => {
    resetPersistedData();
    window.location.reload();
  };

  const buttonClass =
    "px-2.5 h-6 rounded text-[11px] display-font tracking-wider transition-colors";

  return (
    <div
      role="status"
      className="h-9 px-4 flex items-center justify-center gap-3 text-xs"
      style={{
        background: "color-mix(in srgb, var(--color-v2-amber) 12%, var(--color-v2-bg))",
        borderBottom: "1px solid color-mix(in srgb, var(--color-v2-amber) 40%, transparent)",
        color: "var(--color-v2-text)",
      }}
    >
      <span
        className="display-font tracking-widest text-[11px] shrink-0"
        style={{ color: "var(--color-v2-amber-bright)" }}
      >
        Sample data
      </span>

      {confirming ? (
        <>
          <span className="truncate">Erase everything in this browser and start over?</span>
          <button
            onClick={startFresh}
            className={buttonClass}
            style={{
              color: "var(--color-v2-bg-deep)",
              background: "var(--color-v2-amber-bright)",
            }}
          >
            Erase and restart
          </button>
          <button
            onClick={() => setConfirming(false)}
            className={buttonClass}
            style={{
              color: "var(--color-v2-text)",
              border: "1px solid color-mix(in srgb, var(--color-v2-text) 35%, transparent)",
            }}
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <span className="hidden sm:inline truncate">
            This account is pre-filled so you can look around. It isn&apos;t anyone&apos;s real progress.
          </span>
          <button
            onClick={() => setConfirming(true)}
            className={buttonClass}
            style={{
              color: "var(--color-v2-amber-bright)",
              border: "1px solid color-mix(in srgb, var(--color-v2-amber) 55%, transparent)",
            }}
          >
            Start fresh
          </button>
        </>
      )}
    </div>
  );
}
