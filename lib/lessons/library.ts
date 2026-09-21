import { getChapterSection } from "@/lib/seeds/chapters";
import { ALL_SECTORS, getMissionsForCampaign } from "@/lib/seeds/campaigns";
import { SECTIONS as FOUNDATION_SECTIONS } from "@/lib/seeds/foundations-content";

// Every lesson in the app, grouped by sector — derived from the missions that
// use them, so the library can't drift from the curriculum: a lesson a mission
// reads is in the library, in mission order, and says which mission it is from.
//
// Two kinds of reading exist. Linux Operations reads sections of the one big
// Linux Foundations lesson (/foundations?section=N); every other sector reads
// data-driven chapter sections (/lessons/<id>).

export interface LibraryLesson {
  /** Unique within the library: "hw-s1", or "foundation-3". */
  id: string;
  title: string;
  subtitle?: string;
  /** Absent for the Linux Foundations sections, which carry no estimate. */
  minutes?: number;
  href: string;
  missionNumber: number;
  missionTitle: string;
}

export interface LibraryGroup {
  sectorId: string;
  title: string;
  color: string;
  lessons: LibraryLesson[];
}

export const lessonHref = (sectionId: string) => `/lessons/${encodeURIComponent(sectionId)}`;
export const foundationHref = (section: number) => `/foundations?section=${section}`;

export function lessonGroups(): LibraryGroup[] {
  return ALL_SECTORS.map((sector) => {
    const lessons: LibraryLesson[] = [];
    const seen = new Set<string>();
    for (const campaignId of sector.campaignIds) {
      getMissionsForCampaign(campaignId).forEach((mission, index) => {
        for (const step of mission.defaultLoadout) {
          const ref = step.contentRef as { kind?: string; id?: string } | string | undefined;
          if (!ref || typeof ref === "string" || !ref.id) continue;
          const from = { missionNumber: index + 1, missionTitle: mission.title };

          if (ref.kind === "chapter-section") {
            const section = getChapterSection(ref.id);
            if (!section || seen.has(section.id)) continue;
            seen.add(section.id);
            lessons.push({ id: section.id, title: section.title, subtitle: section.subtitle, minutes: section.estimatedMinutes, href: lessonHref(section.id), ...from });
          } else if (ref.kind === "foundation-section") {
            const number = Number(ref.id);
            const section = FOUNDATION_SECTIONS.find((s) => s.id === number);
            const id = `foundation-${number}`;
            if (!section || seen.has(id)) continue;
            seen.add(id);
            lessons.push({ id, title: section.title, href: foundationHref(number), ...from });
          }
        }
      });
    }
    return { sectorId: sector.id, title: sector.title, color: sector.color, lessons };
  }).filter((group) => group.lessons.length > 0);
}
