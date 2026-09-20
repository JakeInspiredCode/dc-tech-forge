import type { Metadata } from "next";
import { ALL_MISSIONS } from "@/lib/seeds/campaigns";
import MissionDetailClient from "./mission-detail-client";

type Props = { params: Promise<{ missionId: string }> };

export function generateStaticParams() {
  return ALL_MISSIONS.map((m) => ({ missionId: m.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { missionId } = await params;
  const mission = ALL_MISSIONS.find((m) => m.id === missionId);
  return mission ? { title: mission.title, description: mission.description } : {};
}

export default async function MissionPage({ params }: Props) {
  const { missionId } = await params;
  return <MissionDetailClient missionId={missionId} />;
}
