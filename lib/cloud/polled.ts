"use client";

// One way to keep a public list fresh: load on mount, again every minute while
// the tab is visible, on focus, and whenever one of `refreshOn` events fires
// (this browser just published a row, or saved). Never more than once every
// few seconds, however many triggers land at once.

import { useCallback, useEffect, useRef, useState } from "react";

export type PollStatus = "off" | "loading" | "live" | "offline";

const POLL_MS = 60_000;
const MIN_GAP_MS = 5_000;

export function usePolled<T>(enabled: boolean, load: () => Promise<T[]>, refreshOn: readonly string[]): { rows: T[]; status: PollStatus; refresh: () => void } {
  const [rows, setRows] = useState<T[]>([]);
  const [status, setStatus] = useState<PollStatus>(enabled ? "loading" : "off");
  const lastRef = useRef(0);
  const loadRef = useRef(load);
  loadRef.current = load;
  const eventsKey = refreshOn.join(",");

  const refresh = useCallback(
    (force = false) => {
      if (!enabled) return;
      const now = Date.now();
      if (!force && now - lastRef.current < MIN_GAP_MS) return;
      lastRef.current = now;
      loadRef
        .current()
        .then((fresh) => {
          setRows(fresh);
          setStatus("live");
        })
        .catch(() => setStatus("offline"));
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) return;
    refresh(true);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const onEvent = () => refresh(true);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const events = eventsKey ? eventsKey.split(",") : [];
    for (const name of events) window.addEventListener(name, onEvent);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      for (const name of events) window.removeEventListener(name, onEvent);
    };
  }, [enabled, refresh, eventsKey]);

  return { rows, status, refresh: () => refresh(true) };
}
