import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ALL_CHAPTERS, getChapterSection } from "@/lib/seeds/chapters";
import LessonClient from "./lesson-client";

// Split server/client like the mission and topic routes: the static export
// needs generateStaticParams to prerender one page per lesson.
export function generateStaticParams() {
  return ALL_CHAPTERS.map((section) => ({ sectionId: section.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ sectionId: string }> }): Promise<Metadata> {
  const { sectionId } = await params;
  const section = getChapterSection(sectionId);
  return { title: section ? section.title : "Lesson not found" };
}

export default async function LessonPage({ params }: { params: Promise<{ sectionId: string }> }) {
  const { sectionId } = await params;
  if (!getChapterSection(sectionId)) notFound();
  return <LessonClient sectionId={sectionId} />;
}
