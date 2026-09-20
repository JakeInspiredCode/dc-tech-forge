"use client";

import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/lib/storage-keys";

const STORAGE_KEY = STORAGE_KEYS.lessonScale;
const SCALES = [0.7, 0.85, 1.0, 1.15] as const;
const DEFAULT_SCALE = 1.0;

export function useLessonScale(): [number, () => void] {
  const [scale, setScale] = useState<number>(DEFAULT_SCALE);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = raw ? parseFloat(raw) : NaN;
    if (SCALES.includes(n as typeof SCALES[number])) setScale(n);
  }, []);

  const cycle = useCallback(() => {
    setScale((prev) => {
      const idx = SCALES.indexOf(prev as typeof SCALES[number]);
      const next = SCALES[(idx + 1) % SCALES.length];
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return [scale, cycle];
}

export function scaleLabel(scale: number): string {
  if (scale < 0.78) return "XS";
  if (scale < 0.95) return "S";
  if (scale > 1.05) return "L";
  return "M";
}
