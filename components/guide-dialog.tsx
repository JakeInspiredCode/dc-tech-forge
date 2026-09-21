"use client";

import { usePathname, useRouter } from "next/navigation";
import ActionButton from "@/components/ui/action-button";
import { GLOSSARY } from "@/lib/glossary";
import { requestTour } from "@/lib/tour/request";
import { useModalDialog } from "@/lib/use-modal-dialog";

// What the "? Guide" button opens: the tour, and what the themed words mean.
export default function GuideDialog({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const ref = useModalDialog(onClose);

  const startTour = () => {
    onClose();
    // The tour points at things on the Galaxy Map, so it runs there.
    requestTour();
    if (pathname !== "/") router.push("/");
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
      style={{ background: "rgba(3, 4, 10, 0.78)" }}
      onClick={onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel rounded-lg w-full max-w-xl p-5 sm:p-6 my-auto"
        style={{ background: "var(--color-v2-bg-surface)" }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 id="guide-title" className="display-font text-lg text-v2-text">
            Guide
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex items-center justify-center w-9 h-9 max-md:w-11 max-md:h-11 -mt-1 -mr-1 rounded text-v2-text-dim hover:text-v2-text hover:bg-v2-bg-elevated text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 pb-5 mb-5 border-b border-v2-border">
          <p className="flex-1 min-w-[12rem] text-sm text-v2-text-dim">New here? The tour takes about thirty seconds.</p>
          <ActionButton data-autofocus onClick={startTour}>
            Take the tour
          </ActionButton>
        </div>

        <h3 className="stats-section-title" style={{ fontSize: 12 }}>
          What the words mean
        </h3>
        <dl className="space-y-3 mt-3">
          {GLOSSARY.map((entry) => (
            <div key={entry.term} className="sm:grid sm:grid-cols-[9.5rem_1fr] sm:gap-4">
              <dt className="display-font text-xs text-v2-cyan pt-0.5">{entry.term}</dt>
              <dd className="text-sm text-v2-text-dim leading-snug">{entry.means}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
