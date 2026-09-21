"use client";

import Link from "next/link";
import { useDueCards, useAllProgress } from "@/lib/convex-hooks";

const ACTIVITIES = [
  {
    href: "/study",
    icon: "▶",
    title: "Study",
    description: "Review due cards, learn new material, or drill by topic",
    color: "text-sky-400",
    bg: "bg-sky-500/8",
    border: "border-sky-500/25",
  },
  {
    href: "/forge/speed-run",
    icon: "⚡",
    title: "Speed Run",
    description: "Timed card blitz — race the clock for points",
    color: "text-yellow-400",
    bg: "bg-yellow-500/8",
    border: "border-yellow-500/25",
  },
  {
    href: "/drill",
    icon: "⚙",
    title: "Incident Drills",
    description: "Walk through scenario-based troubleshooting cards",
    color: "text-orange-400",
    bg: "bg-orange-500/8",
    border: "border-orange-500/25",
  },
  {
    href: "/train/quick-draw",
    icon: "⊕",
    title: "Quick Draw",
    description: "Fast recall — commands, permissions, ports, signals",
    color: "text-emerald-400",
    bg: "bg-emerald-500/8",
    border: "border-emerald-500/25",
  },
  {
    href: "/train/diagnosis",
    icon: "⊘",
    title: "Diagnosis Lab",
    description: "Step-by-step troubleshooting with adaptive teaching",
    color: "text-red-400",
    bg: "bg-red-500/8",
    border: "border-red-500/25",
  },
];

export default function TrainHub() {
  const dueCards = useDueCards();
  const progress = useAllProgress();
  const weakCount = progress.filter((p) => p.weakFlag).length;

  return (
    <div className="min-h-screen bg-v2-bg-deep">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mono mb-1">Train</h1>
        <p className="text-sm text-forge-text-dim mb-6">
          {dueCards.length} cards due{weakCount > 0 ? ` — ${weakCount} weak topic${weakCount !== 1 ? "s" : ""}` : ""}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACTIVITIES.map((a) => (
            <Link
              key={a.title}
              href={a.href}
              className={`rounded-xl p-5 border transition-all duration-150 ${a.bg} ${a.border} hover:ring-1 hover:ring-current ${a.color}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">{a.icon}</span>
                <span className="font-semibold text-sm">{a.title}</span>
              </div>
              <p className="text-xs text-forge-text-dim">{a.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
