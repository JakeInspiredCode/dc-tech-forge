"use client";

import Link from "next/link";

const RESOURCES = [
  {
    href: "/foundations",
    icon: "◒",
    title: "Linux Foundations",
    description: "Interactive guided reference — 10 sections covering core Linux concepts",
    color: "text-purple-400",
    bg: "bg-purple-500/8",
    border: "border-purple-500/25",
  },
  {
    href: "/terminal",
    icon: "▹",
    title: "Terminal Simulator",
    description: "Practice commands in a simulated terminal with reference sidebar",
    color: "text-emerald-400",
    bg: "bg-emerald-500/8",
    border: "border-emerald-500/25",
  },
  {
    href: "/cards",
    icon: "▦",
    title: "Card Browser",
    description: "Browse, filter, and manage all 300+ flashcards",
    color: "text-sky-400",
    bg: "bg-sky-500/8",
    border: "border-sky-500/25",
  },
  {
    href: "/explore/visual-explorer",
    icon: "◎",
    title: "Visual Explorer",
    description: "Filesystem navigator + command dissector with 75 commands",
    color: "text-orange-400",
    bg: "bg-orange-500/8",
    border: "border-orange-500/25",
  },
  {
    href: "/explore/boot-process",
    icon: "⏻",
    title: "Boot Process",
    description: "Learn the 6-stage Linux boot sequence, then triage real boot failure scenarios",
    color: "text-amber-400",
    bg: "bg-amber-500/8",
    border: "border-amber-500/25",
  },
];

export default function ExploreHub() {
  return (
    <div className="min-h-screen bg-v2-bg-deep">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mono mb-1">Explore</h1>
        <p className="text-sm text-forge-text-dim mb-6">
          Reference materials, tools, and interactive explorers
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RESOURCES.map((r) => (
            <Link
              key={r.title}
              href={r.href}
              className={`rounded-xl p-5 border transition-all duration-150 ${r.bg} ${r.border} hover:ring-1 hover:ring-current ${r.color}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">{r.icon}</span>
                <span className="font-semibold text-sm">{r.title}</span>
              </div>
              <p className="text-xs text-forge-text-dim">{r.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
