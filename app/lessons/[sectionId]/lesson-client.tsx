"use client";

import dynamic from "next/dynamic";

// The reader is large and interactive; load it on the client, as missions do.
const ChapterRenderer = dynamic(() => import("@/components/chapter/chapter-renderer"), { ssr: false });

export default function LessonClient({ sectionId }: { sectionId: string }) {
  return <ChapterRenderer sectionId={sectionId} />;
}
