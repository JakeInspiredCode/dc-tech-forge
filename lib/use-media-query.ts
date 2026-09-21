"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Live `matchMedia` result. False on the server and where matchMedia is missing. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );
  const get = useCallback(
    () => typeof window.matchMedia === "function" && window.matchMedia(query).matches,
    [query],
  );
  return useSyncExternalStore(subscribe, get, () => false);
}

/** Below Tailwind's `lg`: where both maps become lists (see galaxy-map.tsx). */
export const COMPACT_LAYOUT_QUERY = "(max-width: 1023px)";
