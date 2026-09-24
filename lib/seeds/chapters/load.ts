import type { ChapterSection } from "@/lib/types/chapter";

// One dynamic import per sector. The lesson reader used to import every chapter,
// so reading ONE lesson downloaded all 64 (228 KB gzipped). A section id's prefix
// says which sector file it lives in.
//
// index.ts still has the synchronous list, for the server-rendered library,
// static params and tests — nothing that ships to the browser may import it
// (lib/bundle-boundaries.test.ts).

const LOADERS: Record<string, () => Promise<ChapterSection[]>> = {
  hw: () => import("./hardware-chapters").then((m) => m.HARDWARE_CHAPTERS),
  net: () => import("./networking-chapters").then((m) => m.NETWORKING_CHAPTERS),
  fib: () => import("./fiber-chapters").then((m) => m.FIBER_CHAPTERS),
  ops: () => import("./ops-chapters").then((m) => m.OPS_CHAPTERS),
  pwr: () => import("./power-chapters").then((m) => m.POWER_CHAPTERS),
  scl: () => import("./scale-chapters").then((m) => m.SCALE_CHAPTERS),
  lxa: () => import("./linux-advanced-chapters").then((m) => m.LINUX_ADVANCED_CHAPTERS),
};

export const CHAPTER_PREFIXES = Object.keys(LOADERS);

/** "hw-s3" -> "hw". */
export function chapterPrefix(sectionId: string): string {
  return sectionId.split("-")[0];
}

export async function loadChapterSection(sectionId: string): Promise<ChapterSection | null> {
  const load = LOADERS[chapterPrefix(sectionId)];
  if (!load) return null;
  return (await load()).find((section) => section.id === sectionId) ?? null;
}
