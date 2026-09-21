"use client";

import { useCallback, useSyncExternalStore } from "react";

// The OS "reduce motion" setting. CSS animations and transitions are handled
// globally in app/globals.css; this hook is for motion CSS can't reach —
// canvas loops and SVG <animate> elements.

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window.matchMedia !== "function") return () => {};
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** Live value: flips without a reload when the setting changes. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}

/**
 * A ref for an <svg> root: freezes every SMIL animation inside it (<animate>,
 * <animateTransform>, <animateMotion>) while reduced motion is on. Elements
 * keep their starting pose — planets stay on their orbits, they just stop
 * moving — and anything added to the tree later is frozen too.
 *
 * A callback ref rather than an effect, because both maps mount their <svg>
 * only after saved progress has loaded.
 */
export function useSvgMotionRef(): (svg: SVGSVGElement | null) => void {
  const reduced = useReducedMotion();
  return useCallback(
    (svg: SVGSVGElement | null) => {
      if (!svg || typeof svg.pauseAnimations !== "function") return;
      if (reduced) svg.pauseAnimations();
      else svg.unpauseAnimations();
    },
    [reduced],
  );
}
