"use client";

// Lets one part of the app ask for the tour to start ("? Guide" in the nav)
// and another part start it (the home page, where the tour's anchors live),
// without a page reload in between.

let requested = false;
const listeners = new Set<() => void>();

export function requestTour(): void {
  requested = true;
  listeners.forEach((l) => l());
}

export function clearTourRequest(): void {
  if (!requested) return;
  requested = false;
  listeners.forEach((l) => l());
}

export function isTourRequested(): boolean {
  return requested;
}

export function subscribeToTourRequest(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
