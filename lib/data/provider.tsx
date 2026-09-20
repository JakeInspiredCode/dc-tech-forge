"use client";

import { useEffect, type ReactNode } from "react";
import { installPersistence } from "./persistence";
import { seedIfEmpty } from "./seed";
import { goLive } from "./store";

const DEMO_PARAM = "demo";

// A "?demo=1" link opens straight onto sample progress. The parameter is
// consumed rather than left in the URL: otherwise reloading after "Start
// fresh" would load the sample straight back in.
function consumeDemoParam(): boolean {
  const url = new URL(window.location.href);
  if (url.searchParams.get(DEMO_PARAM) !== "1") return false;
  url.searchParams.delete(DEMO_PARAM);
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  return true;
}

export default function DataProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const start = async () => {
      try {
        installPersistence();
        seedIfEmpty();
        if (consumeDemoParam()) {
          // Loaded on demand so the generator stays out of every page's bundle.
          // It declines on its own if this browser already has real progress.
          const { loadSampleData } = await import("./sample-data");
          await loadSampleData();
        }
      } catch (err) {
        console.warn("[data] startup did not complete cleanly:", err);
      } finally {
        goLive();
      }
    };
    void start();
  }, []);
  return <>{children}</>;
}
