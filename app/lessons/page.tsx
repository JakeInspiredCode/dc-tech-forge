import Link from "next/link";
import ToolPage from "@/components/ui/tool-page";
import { lessonGroups } from "@/lib/lessons/library";

// Every lesson, outside of a mission. Missions are the guided path; this is
// the shelf — for looking something up, or re-reading one section without
// replaying the mission around it. A server component: it is all static data.
export default function LessonLibraryPage() {
  const groups = lessonGroups();
  const total = groups.reduce((sum, g) => sum + g.lessons.length, 0);

  return (
    <ToolPage
      title="Lesson Library"
      subtitle={`All ${total} lessons from the ${groups.length} sectors, in curriculum order. Missions walk you through these one at a time — this is where to look one up or read it again.`}
      width="wide"
    >
      <nav aria-label="Sectors" className="flex flex-wrap gap-2 mb-8">
        {groups.map((group) => (
          <a
            key={group.sectorId}
            href={`#${group.sectorId}`}
            className="inline-flex items-center gap-2 max-md:min-h-[44px] px-3 py-1.5 rounded border border-v2-border text-xs text-v2-text-dim hover:text-v2-text hover:border-v2-cyan/40 transition-colors"
          >
            <span aria-hidden="true" className="w-2 h-2 rounded-full" style={{ background: group.color }} />
            {group.title}
            <span className="text-v2-text-muted telemetry-font">{group.lessons.length}</span>
          </a>
        ))}
      </nav>

      <div className="space-y-10">
        {groups.map((group) => (
          <section key={group.sectorId} id={group.sectorId} aria-labelledby={`${group.sectorId}-h`} className="scroll-mt-24">
            <h2 id={`${group.sectorId}-h`} className="flex items-center gap-2.5 display-font text-sm text-v2-text mb-3">
              <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full" style={{ background: group.color, boxShadow: `0 0 8px ${group.color}` }} />
              {group.title}
            </h2>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {group.lessons.map((lesson, i) => (
                <li key={lesson.id}>
                  <Link
                    href={lesson.href}
                    className="h-full flex items-start gap-3 rounded-lg p-3 bg-v2-bg-surface border border-v2-border hover:border-v2-cyan/40 transition-colors"
                  >
                    <span aria-hidden="true" className="telemetry-font text-xs text-v2-text-muted w-5 shrink-0 pt-0.5 text-right">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-v2-text leading-snug">{lesson.title}</span>
                      {lesson.subtitle && <span className="block text-xs text-v2-text-dim mt-0.5 leading-snug">{lesson.subtitle}</span>}
                      <span className="block text-xs text-v2-text-muted mt-1.5">
                        {lesson.minutes ? `${lesson.minutes} min · ` : ""}Mission {lesson.missionNumber}: {lesson.missionTitle}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </ToolPage>
  );
}
