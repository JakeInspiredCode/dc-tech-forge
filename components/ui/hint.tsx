"use client";

import { useEffect, useState } from "react";
import { HINTS, isHintSeen, markHintSeen, type HintId } from "@/lib/hints";

// A one-line "what is this screen" note, shown once per browser. Fixed to the
// bottom so it costs the fixed-height hubs no layout, and never blocks a click
// on anything but itself.
export default function Hint({ id }: { id: HintId }) {
  // Storage is only readable in the browser: start hidden so the server and the
  // first client render agree.
  const [show, setShow] = useState(false);
  useEffect(() => setShow(!isHintSeen(id)), [id]);

  if (!show) return null;

  return (
    <aside
      role="note"
      aria-label="Tip"
      className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-3 pointer-events-none"
    >
      <div
        className="pointer-events-auto max-w-xl w-full flex items-start gap-3 rounded-lg px-4 py-3 text-sm text-v2-text"
        style={{
          background: "color-mix(in srgb, var(--color-v2-bg-overlay) 96%, transparent)",
          border: "1px solid color-mix(in srgb, var(--color-v2-cyan) 45%, transparent)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
        }}
      >
        <span aria-hidden="true" className="text-v2-cyan mt-0.5">
          ?
        </span>
        <p className="flex-1 leading-snug">{HINTS[id]}</p>
        <button
          type="button"
          onClick={() => {
            markHintSeen(id);
            setShow(false);
          }}
          className="shrink-0 inline-flex items-center justify-center min-h-[44px] md:min-h-0 px-3 py-1 rounded text-xs text-v2-cyan border border-v2-cyan/40 hover:bg-v2-cyan/15 transition-colors"
        >
          Got it
        </button>
      </div>
    </aside>
  );
}
