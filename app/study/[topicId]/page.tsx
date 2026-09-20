import type { Metadata } from "next";
import { TOPICS } from "@/lib/types";
import TopicStudyClient from "./topic-study-client";

type Props = { params: Promise<{ topicId: string }> };

export function generateStaticParams() {
  return TOPICS.map((t) => ({ topicId: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topicId } = await params;
  const topic = TOPICS.find((t) => t.id === topicId);
  return topic ? { title: `Study: ${topic.name}` } : {};
}

export default async function TopicStudyPage({ params }: Props) {
  const { topicId } = await params;
  return <TopicStudyClient topicId={topicId} />;
}
