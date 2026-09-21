"use client";

import { useEffect, useState } from "react";
import LinuxFoundations from "@/components/linux-foundations";
import { SECTIONS } from "@/lib/seeds/foundations-content";

// The Lesson Library links to one section (`?section=3`). Read from the URL on
// mount rather than useSearchParams, which would force a Suspense boundary on
// a statically exported page. `null` until read, so the lesson mounts once,
// already on the right section.
export default function FoundationsPage() {
  const [section, setSection] = useState<number | null>(null);

  useEffect(() => {
    const asked = Number(new URLSearchParams(window.location.search).get("section"));
    setSection(SECTIONS.some((s) => s.id === asked) ? asked : 1);
  }, []);

  if (section === null) return null;
  return <LinuxFoundations initialSection={section} />;
}
