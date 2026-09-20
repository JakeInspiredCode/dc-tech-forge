"use client";

import { useState } from "react";
import Link from "next/link";
import HexPanel from "@/components/ui/hex-panel";
import ActionButton from "@/components/ui/action-button";
import { BRAND } from "@/lib/brand";
import { STORAGE_KEYS } from "@/lib/storage-keys";

const STORAGE_KEY = STORAGE_KEYS.onboardingDone;

const SCREENS = [
  {
    title: "Welcome, Operator",
    body: `${BRAND.name} is your training platform for data center operations. You'll master Linux administration, networking, hardware, and ops through missions, campaigns, and bounties.`,
  },
  {
    title: "The Galaxy Map",
    body: "This is your territory. Each sector of the galaxy is a skill domain to master. Volunteer for campaigns to unlock missions. Your goal: secure every sector.",
  },
  {
    title: "Campaigns",
    body: "Volunteer for a campaign in any sector for structured learning. The app tells you what to do each day. Show up, complete missions, expand your territory over weeks.",
  },
  {
    title: "Missions & Bounties",
    body: "Missions are learning chapters — read, practice, then pass a knowledge check to claim the system. Bounties are quick practice rounds — grab one whenever you have 10 minutes.",
  },
  {
    title: "Your Loadout",
    body: "Every mission has a recommended set of activities. But you choose how to prepare. Skip what you know, add what you need. The only thing that matters: pass the knowledge check.",
  },
];

export function clearOnboardingFlag() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function isOnboardingDone(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  const finish = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    onComplete();
  };

  // Final screen — deploy paths
  if (step >= SCREENS.length) {
    return (
      <div className="fixed inset-0 z-50 bg-v2-bg-deep flex items-center justify-center p-4">
        <div className="scan-lines absolute inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-lg w-full">
          <HexPanel size="lg">
            <h2 className="display-font text-xl text-v2-cyan tracking-wider mb-6">
              Deploy
            </h2>

            <div className="space-y-3 mb-8">
              <Link
                href="/"
                onClick={finish}
                className="block w-full"
              >
                <div className="p-4 bg-v2-bg-elevated border border-v2-cyan/30 rounded hover:border-v2-cyan transition-colors text-left">
                  <p className="text-v2-text font-medium">Volunteer for Penguin Core Campaign</p>
                  <p className="text-v2-text-dim text-sm">Start the Linux campaign — structured daily missions</p>
                </div>
              </Link>

              <Link
                href="/"
                onClick={finish}
                className="block w-full"
              >
                <div className="p-4 bg-v2-bg-elevated border border-v2-border rounded hover:border-v2-cyan/40 transition-colors text-left">
                  <p className="text-v2-text font-medium">Browse the Galaxy Map</p>
                  <p className="text-v2-text-dim text-sm">Explore all sectors and campaigns</p>
                </div>
              </Link>

              <Link
                href="/arsenal"
                onClick={finish}
                className="block w-full"
              >
                <div className="p-4 bg-v2-bg-elevated border border-v2-border rounded hover:border-v2-cyan/40 transition-colors text-left">
                  <p className="text-v2-text font-medium">Hit the Arsenal</p>
                  <p className="text-v2-text-dim text-sm">Browse all available activities</p>
                </div>
              </Link>
            </div>

            <button
              onClick={finish}
              className="text-v2-text-muted text-sm hover:text-v2-text transition-colors"
            >
              Skip
            </button>
          </HexPanel>
        </div>
      </div>
    );
  }

  const screen = SCREENS[step];

  return (
    <div className="fixed inset-0 z-50 bg-v2-bg-deep flex items-center justify-center p-4">
      <div className="scan-lines absolute inset-0 pointer-events-none" />
      <div className="relative z-10 max-w-lg w-full">
        <HexPanel size="lg">
          {/* Progress dots */}
          <div className="flex gap-1.5 mb-6">
            {SCREENS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-v2-cyan" : "bg-v2-bg-elevated"
                }`}
              />
            ))}
            <div
              className={`h-1 flex-1 rounded-full ${
                step >= SCREENS.length ? "bg-v2-cyan" : "bg-v2-bg-elevated"
              }`}
            />
          </div>

          <h2 className="display-font text-xl text-v2-cyan tracking-wider mb-4">
            {screen.title}
          </h2>
          <p className="text-v2-text-dim leading-relaxed mb-8">{screen.body}</p>

          <div className="flex items-center justify-between">
            <button
              onClick={finish}
              className="text-v2-text-muted text-sm hover:text-v2-text transition-colors"
            >
              Skip
            </button>
            <ActionButton variant="primary" onClick={() => setStep(step + 1)}>
              Next
            </ActionButton>
          </div>
        </HexPanel>
      </div>
    </div>
  );
}
