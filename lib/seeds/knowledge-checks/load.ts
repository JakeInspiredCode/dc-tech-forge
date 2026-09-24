import type { MCQuestion } from "@/lib/types/campaign";

// One dynamic import per mission. The mission player used to import the whole
// question bank, so opening ANY mission downloaded the quizzes for all 44
// (136 KB gzipped). Now it fetches the one it is about to ask.
//
// index.ts still has the synchronous bank, for tests and tooling — nothing that
// ships to the browser may import it (lib/bundle-boundaries.test.ts).

const LOADERS: Record<string, () => Promise<MCQuestion[]>> = {
  "linux-m01": () => import("./mission-01").then((m) => m.MISSION_01_QUESTIONS),
  "linux-m02": () => import("./mission-02").then((m) => m.MISSION_02_QUESTIONS),
  "linux-m03": () => import("./mission-03").then((m) => m.MISSION_03_QUESTIONS),
  "linux-m04": () => import("./mission-04").then((m) => m.MISSION_04_QUESTIONS),
  "linux-m05": () => import("./mission-05").then((m) => m.MISSION_05_QUESTIONS),
  "linux-m06": () => import("./mission-06").then((m) => m.MISSION_06_QUESTIONS),
  "linux-m07": () => import("./mission-07").then((m) => m.MISSION_07_QUESTIONS),
  "linux-m08": () => import("./mission-08").then((m) => m.MISSION_08_QUESTIONS),
  "linux-m09": () => import("./mission-09").then((m) => m.MISSION_09_QUESTIONS),
  "linux-m10": () => import("./mission-10").then((m) => m.MISSION_10_QUESTIONS),
  "linux-m11": () => import("./mission-11").then((m) => m.MISSION_11_QUESTIONS),
  "linux-m12": () => import("./mission-12").then((m) => m.MISSION_12_QUESTIONS),
  "hw-m01": () => import("./hw-m01").then((m) => m.HW_M01_QUESTIONS),
  "hw-m02": () => import("./hw-m02").then((m) => m.HW_M02_QUESTIONS),
  "hw-m03": () => import("./hw-m03").then((m) => m.HW_M03_QUESTIONS),
  "hw-m04": () => import("./hw-m04").then((m) => m.HW_M04_QUESTIONS),
  "net-m01": () => import("./net-m01").then((m) => m.NET_M01_QUESTIONS),
  "net-m02": () => import("./net-m02").then((m) => m.NET_M02_QUESTIONS),
  "net-m03": () => import("./net-m03").then((m) => m.NET_M03_QUESTIONS),
  "net-m04": () => import("./net-m04").then((m) => m.NET_M04_QUESTIONS),
  "fib-m01": () => import("./fib-m01").then((m) => m.FIB_M01_QUESTIONS),
  "fib-m02": () => import("./fib-m02").then((m) => m.FIB_M02_QUESTIONS),
  "fib-m03": () => import("./fib-m03").then((m) => m.FIB_M03_QUESTIONS),
  "fib-m04": () => import("./fib-m04").then((m) => m.FIB_M04_QUESTIONS),
  "ops-m01": () => import("./ops-m01").then((m) => m.OPS_M01_QUESTIONS),
  "ops-m02": () => import("./ops-m02").then((m) => m.OPS_M02_QUESTIONS),
  "ops-m03": () => import("./ops-m03").then((m) => m.OPS_M03_QUESTIONS),
  "ops-m04": () => import("./ops-m04").then((m) => m.OPS_M04_QUESTIONS),
  "pwr-m01": () => import("./pwr-m01").then((m) => m.PWR_M01_QUESTIONS),
  "pwr-m02": () => import("./pwr-m02").then((m) => m.PWR_M02_QUESTIONS),
  "pwr-m03": () => import("./pwr-m03").then((m) => m.PWR_M03_QUESTIONS),
  "pwr-m04": () => import("./pwr-m04").then((m) => m.PWR_M04_QUESTIONS),
  "scl-m01": () => import("./scl-m01").then((m) => m.SCL_M01_QUESTIONS),
  "scl-m02": () => import("./scl-m02").then((m) => m.SCL_M02_QUESTIONS),
  "scl-m03": () => import("./scl-m03").then((m) => m.SCL_M03_QUESTIONS),
  "scl-m04": () => import("./scl-m04").then((m) => m.SCL_M04_QUESTIONS),
  "linux-m13": () => import("./linux-m13").then((m) => m.LINUX_M13_QUESTIONS),
  "linux-m14": () => import("./linux-m14").then((m) => m.LINUX_M14_QUESTIONS),
  "linux-m15": () => import("./linux-m15").then((m) => m.LINUX_M15_QUESTIONS),
  "linux-m16": () => import("./linux-m16").then((m) => m.LINUX_M16_QUESTIONS),
  "linux-m17": () => import("./linux-m17").then((m) => m.LINUX_M17_QUESTIONS),
  "linux-m18": () => import("./linux-m18").then((m) => m.LINUX_M18_QUESTIONS),
  "linux-m19": () => import("./linux-m19").then((m) => m.LINUX_M19_QUESTIONS),
  "linux-m20": () => import("./linux-m20").then((m) => m.LINUX_M20_QUESTIONS),
};

export function hasKnowledgeCheckQuestions(missionId: string): boolean {
  return missionId in LOADERS;
}

/** The mission's multiple-choice questions, or null if it has none. */
export async function loadMCQuestions(missionId: string): Promise<MCQuestion[] | null> {
  const load = LOADERS[missionId];
  return load ? load() : null;
}

export const KNOWLEDGE_CHECK_MISSION_IDS = Object.keys(LOADERS);
