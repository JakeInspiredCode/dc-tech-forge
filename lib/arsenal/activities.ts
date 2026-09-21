import { getAllModules } from "@/lib/seeds/quick-draw-modules";

// Everything Arsenal offers, and how it is searched. Kept out of the component
// so it can be tested — see activities.test.ts, and lib/routes.test.ts, which
// relies on this list being where tools get linked from.

export type ActivityCategory = "learn" | "practice" | "test" | "tools";

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  difficulty?: "Easy" | "Medium" | "Hard" | "Mixed";
  topics: string[];
  estimatedMinutes: number;
  route: string;
}

export const CATEGORIES: { key: ActivityCategory; label: string }[] = [
  { key: "learn", label: "Learn" },
  { key: "practice", label: "Practice" },
  { key: "test", label: "Test" },
  // Story Bank and the Card Browser each had a category to themselves.
  { key: "tools", label: "Tools" },
];

const QUICK_DRAW_META: Record<string, Pick<Activity, "difficulty" | "topics" | "estimatedMinutes">> = {
  permissions: { difficulty: "Medium", topics: ["linux"], estimatedMinutes: 5 },
  ports: { difficulty: "Easy", topics: ["networking"], estimatedMinutes: 5 },
  signals: { difficulty: "Easy", topics: ["linux"], estimatedMinutes: 5 },
  "ip-ranges": { difficulty: "Medium", topics: ["networking"], estimatedMinutes: 5 },
  ssh: { difficulty: "Medium", topics: ["linux"], estimatedMinutes: 5 },
  "command-recall": { difficulty: "Medium", topics: ["linux"], estimatedMinutes: 8 },
  "flag-sniper": { difficulty: "Hard", topics: ["linux"], estimatedMinutes: 8 },
};

/** Link straight to one Quick Draw module instead of to the picker. */
export function quickDrawHref(moduleId: string): string {
  return `/train/quick-draw?module=${encodeURIComponent(moduleId)}`;
}

// One card per real module, named after it. They used to be written out by
// hand: eight cards for seven modules (two described the same one), under
// names the Quick Draw page itself never used, all opening the same picker.
const QUICK_DRAW: Activity[] = getAllModules().map((mod) => ({
  id: `qd-${mod.id}`,
  title: `Quick Draw: ${mod.title}`,
  description: mod.description,
  category: "practice",
  ...(QUICK_DRAW_META[mod.id] ?? { difficulty: "Medium", topics: ["linux"], estimatedMinutes: 5 }),
  route: quickDrawHref(mod.id),
}));

const LEARN: Activity[] = [
  { id: "lesson-library", title: "Lesson Library", description: "Every lesson from all eight sectors — look one up or re-read it without replaying the mission", category: "learn", topics: ["linux", "hardware", "networking", "fiber", "power-cooling", "ops-processes", "scale"], estimatedMinutes: 10, route: "/lessons" },
  { id: "boot-learn", title: "Boot Process — Learn", description: "Interactive 3-layer boot sequence walkthrough", category: "learn", topics: ["linux"], estimatedMinutes: 15, route: "/boot-learn" },
  { id: "filesystem-explorer", title: "Filesystem Navigator", description: "Interactive Linux directory tree with descriptions", category: "learn", topics: ["linux"], estimatedMinutes: 10, route: "/filesystem-navigator" },
  { id: "command-dissector", title: "Command Dissector", description: "Break down commands into parts — command, flags, arguments", category: "learn", topics: ["linux"], estimatedMinutes: 10, route: "/command-dissector" },
  { id: "fs-types", title: "Filesystem Types", description: "Compare ext4, XFS, btrfs, NFS, tmpfs, overlay", category: "learn", topics: ["linux"], estimatedMinutes: 8, route: "/filesystem-types" },
];

const PRACTICE: Activity[] = [
  { id: "flashcards", title: "Flashcard Review", description: "Spaced-repetition review by topic, tier, or mixed", category: "practice", topics: ["linux", "hardware", "networking", "fiber", "power-cooling", "ops-processes", "scale"], estimatedMinutes: 10, route: "/study" },
  { id: "fs-label-quiz", title: "Filesystem Label Quiz", description: "Given a description, type the correct Linux path", category: "practice", difficulty: "Medium", topics: ["linux"], estimatedMinutes: 8, route: "/filesystem-navigator?mode=label" },
  { id: "speed-run", title: "Speed Run", description: "Timed free-recall: answer as many cards as you can against the clock", category: "practice", difficulty: "Hard", topics: ["linux", "hardware", "networking"], estimatedMinutes: 5, route: "/forge/speed-run" },
  { id: "terminal", title: "Terminal Simulator", description: "Practice Linux commands in a simulated environment", category: "practice", topics: ["linux"], estimatedMinutes: 15, route: "/terminal" },
  { id: "downtime-smash", title: "Battlestation", description: "Live ticket simulator — solve data center tickets at 6 difficulty levels", category: "practice", difficulty: "Mixed", topics: ["linux", "hardware", "networking"], estimatedMinutes: 15, route: "/battle-station" },
];

const TEST: Activity[] = [
  { id: "diagnosis", title: "Diagnosis Lab", description: "Multi-step troubleshooting scenarios by difficulty", category: "test", difficulty: "Mixed", topics: ["linux", "hardware", "networking"], estimatedMinutes: 10, route: "/train/diagnosis" },
  { id: "drills", title: "Incident Drills", description: "Live incident response scenarios with key-term scoring", category: "test", difficulty: "Hard", topics: ["linux", "hardware", "networking"], estimatedMinutes: 10, route: "/drill" },
  { id: "boot-triage", title: "Boot Triage", description: "Diagnose boot failures from symptoms and logs", category: "test", difficulty: "Medium", topics: ["linux"], estimatedMinutes: 10, route: "/boot-triage" },
  { id: "fs-types-quiz", title: "Filesystem Types Quiz", description: "Identify the filesystem from a scenario description", category: "test", difficulty: "Medium", topics: ["linux"], estimatedMinutes: 6, route: "/filesystem-types?mode=quiz" },
];

const TOOLS: Activity[] = [
  { id: "stories", title: "Story Bank", description: "Build and rehearse STAR stories for interviews", category: "tools", topics: ["behavioral"], estimatedMinutes: 10, route: "/stories" },
  { id: "cards", title: "Card Browser", description: "Browse and search all flashcards in the system", category: "tools", topics: [], estimatedMinutes: 5, route: "/cards" },
];

const [flashcards, ...otherPractice] = PRACTICE;

export const ACTIVITIES: Activity[] = [...LEARN, flashcards, ...QUICK_DRAW, ...otherPractice, ...TEST, ...TOOLS];

function matches(activity: Activity, q: string): boolean {
  return (
    activity.title.toLowerCase().includes(q) ||
    activity.description.toLowerCase().includes(q) ||
    activity.topics.some((t) => t.includes(q)) ||
    (activity.difficulty?.toLowerCase().includes(q) ?? false)
  );
}

/**
 * With nothing typed: the chosen category. With a query: every category —
 * searching only the open tab answered "No activities match" for things that
 * were one tab over.
 */
export function findActivities(query: string, category: ActivityCategory): Activity[] {
  const q = query.trim().toLowerCase();
  if (!q) return ACTIVITIES.filter((a) => a.category === category);
  return ACTIVITIES.filter((a) => matches(a, q));
}
