"use client";

// Whether this browser's account is pre-filled with sample progress. Kept
// apart from sample-data.ts on purpose: the banner in the root layout needs to
// read this on every page, and must not pull the sample generator — and the
// content modules it imports — into every route's bundle.

import { STORAGE_KEYS } from "@/lib/storage-keys";

export function isSampleDataLoaded(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.sampleData) === "1";
  } catch {
    return false;
  }
}

export function setSampleDataFlag(on: boolean): void {
  try {
    if (on) window.localStorage.setItem(STORAGE_KEYS.sampleData, "1");
    else window.localStorage.removeItem(STORAGE_KEYS.sampleData);
  } catch {
    // Storage blocked. The flag only drives a banner; the data is unaffected.
  }
}
