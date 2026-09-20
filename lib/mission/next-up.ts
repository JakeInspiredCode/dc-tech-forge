// "What should I do next?" — the one question both maps left unanswered.
// Pure, so it can be tested; the maps just render the answer.

export interface CampaignOutline {
  id: string;
  title: string;
  missions: ReadonlyArray<{ id: string; title: string }>;
}

export type NextUp =
  | {
      /** "start" for an untouched account, "continue" once anything is under way. */
      kind: "start" | "continue";
      campaignId: string;
      campaignTitle: string;
      missionId: string;
      missionTitle: string;
      /** 1-based position within its campaign. */
      missionNumber: number;
    }
  | { kind: "all-done" };

type StatusOf = (missionId: string) => string | undefined;

const isDone = (status: string | undefined) => status === "accomplished";
const isUnderWay = (status: string | undefined) => status === "in-progress";

/**
 * Pick the mission to point the learner at.
 *
 * Campaign: the one they were last in (if they've actually made progress
 * there), else one with a mission under way, else one they've started, else
 * the first in the curriculum. Mission: the one under way, else the first
 * unfinished one.
 */
export function nextUp(
  campaigns: ReadonlyArray<CampaignOutline>,
  statusOf: StatusOf,
  lastCampaignId?: string | null,
): NextUp {
  const unfinished = campaigns.filter((c) => c.missions.some((m) => !isDone(statusOf(m.id))));
  if (unfinished.length === 0) return { kind: "all-done" };

  const touched = (c: CampaignOutline) =>
    c.missions.some((m) => isDone(statusOf(m.id)) || isUnderWay(statusOf(m.id)));
  const anyProgress = campaigns.some(touched);

  const campaign =
    unfinished.find((c) => c.id === lastCampaignId && touched(c)) ??
    unfinished.find((c) => c.missions.some((m) => isUnderWay(statusOf(m.id)))) ??
    unfinished.find(touched) ??
    unfinished[0];

  const mission =
    campaign.missions.find((m) => isUnderWay(statusOf(m.id))) ??
    campaign.missions.find((m) => !isDone(statusOf(m.id)))!;

  return {
    kind: anyProgress ? "continue" : "start",
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    missionId: mission.id,
    missionTitle: mission.title,
    missionNumber: campaign.missions.indexOf(mission) + 1,
  };
}

export function missionHref(missionId: string): string {
  return `/missions/${encodeURIComponent(missionId)}?autostart=true`;
}
