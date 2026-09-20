"use client";

// First-run tour. A welcome card, then three spotlights on real parts of the
// Galaxy Map, ending on a button that opens Mission 1.
//
// It is an overlay on the live map rather than a screen in front of it: the
// map is the most persuasive thing the app has, so a newcomer should see it
// immediately, and the tour can point at the actual controls instead of
// describing them.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ActionButton from "@/components/ui/action-button";
import { BRAND } from "@/lib/brand";
import { hasUserActivity } from "@/lib/data/activity";
import { isSampleDataLoaded } from "@/lib/data/sample-flag";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { inflate, placeCard, type Placement, type Rect } from "@/lib/tour/placement";

const FIRST_MISSION_HREF = "/missions/linux-m01?autostart=true";
/** The sector whose preview the tour keeps open. */
export const TOUR_SECTOR_ID = "sector-linux";

interface Step {
  /** What to spotlight. Omitted for the welcome card. */
  anchor?: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    title: `Welcome to ${BRAND.name}`,
    body: "Hands-on training for data center technician work — Linux, networking, hardware, power, fiber, and ops. Everything is unlocked, and your progress is saved in this browser. There is no account to create.",
  },
  {
    anchor: `[data-sector-id="${TOUR_SECTOR_ID}"]`,
    title: "Each star is a skill area",
    body: "This map is your curriculum. Each star is a sector — Linux, networking, hardware, and so on. Linux Operations, in the middle, is the best place to start.",
  },
  {
    anchor: '[data-tour="sector-panel"]',
    title: "A sector holds a campaign",
    body: "Point at a star to preview its campaign here: a run of short missions, each with a time estimate. Select the star to open it.",
  },
  {
    anchor: '[data-tour="nav-tabs"]',
    title: "Four places to work",
    body: "Missions is your guided path. Arsenal is practice drills on demand. Battlestation is a live ticket simulator. Profile has your progress, backups, and settings.",
  },
];

export function isOnboardingDone(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.onboardingDone) === "true";
  } catch {
    return true; // storage blocked: don't nag on every visit
  }
}

function markOnboardingDone(): void {
  try {
    window.localStorage.setItem(STORAGE_KEYS.onboardingDone, "true");
  } catch {
    // Nothing to do; the tour will simply offer itself again next time.
  }
}

const TOLERANCE_PX = 3;

function sameRect(a: Rect | null, b: Rect | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    Math.abs(a.x - b.x) < TOLERANCE_PX &&
    Math.abs(a.y - b.y) < TOLERANCE_PX &&
    Math.abs(a.width - b.width) < TOLERANCE_PX &&
    Math.abs(a.height - b.height) < TOLERANCE_PX
  );
}

function rectOf(selector: string | undefined): Rect | null {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return null;
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}

interface OnboardingProps {
  onComplete: () => void;
  /** Tells the map which sector to preview, so the panel step has real content. */
  onFocusSector: (sectorId: string | null) => void;
}

export default function Onboarding({ onComplete, onFocusSector }: OnboardingProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [anchorRect, setAnchorRect] = useState<Rect | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  // Motion is switched on only after the card's first placement, so it appears
  // in position instead of flying in from the corner it was measured at.
  const [canGlide, setCanGlide] = useState(false);
  const [offerSample, setOfferSample] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const bodyId = useId();

  const step = STEPS[index];
  const isWelcome = index === 0;
  const isLast = index === STEPS.length - 1;

  // Sample progress is only offered to an account with nothing in it.
  useEffect(() => {
    setOfferSample(!hasUserActivity() && !isSampleDataLoaded());
  }, []);

  // Give focus back to whatever had it (the "Guide" button, on a replay).
  useEffect(() => {
    const previous = document.activeElement;
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  // Keep the Linux preview open from the star step onward.
  useEffect(() => {
    onFocusSector(index >= 1 ? TOUR_SECTOR_ID : null);
  }, [index, onFocusSector]);
  useEffect(() => () => onFocusSector(null), [onFocusSector]);

  const lastMeasured = useRef<{ anchor: Rect | null; cardHeight: number } | null>(null);

  const measure = useCallback(() => {
    const rect = rectOf(step.anchor);
    const card = cardRef.current?.getBoundingClientRect();
    if (!card) return;

    // Skip sub-pixel noise: a star's orbiting planets nudge its bounds by a
    // pixel or so every frame, and re-rendering for that would make the
    // spotlight shimmer.
    const prev = lastMeasured.current;
    if (prev && sameRect(prev.anchor, rect) && Math.abs(prev.cardHeight - card.height) < 2) return;
    lastMeasured.current = { anchor: rect, cardHeight: card.height };

    setAnchorRect(rect);
    setPlacement(
      placeCard(
        rect && inflate(rect, 8),
        { width: card.width, height: card.height },
        { width: window.innerWidth, height: window.innerHeight },
      ),
    );
  }, [step.anchor]);

  // Measure after layout, then keep watching while the tour is open. The map
  // renders once the data layer goes live, so an anchor may not exist on the
  // first pass; and the page can shift under the tour (loading sample progress
  // adds the banner, which moves everything down).
  useLayoutEffect(() => {
    lastMeasured.current = null;
    measure();
    const watch = window.setInterval(measure, 300);
    window.addEventListener("resize", measure);
    return () => {
      window.clearInterval(watch);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  // A hidden element can't take focus, so wait until the card has a position.
  const placed = placement !== null;
  useEffect(() => {
    if (!placed) return;
    primaryRef.current?.focus();
    const t = window.setTimeout(() => setCanGlide(true), 0);
    return () => window.clearTimeout(t);
  }, [index, placed]);

  const finish = useCallback(() => {
    markOnboardingDone();
    onComplete();
  }, [onComplete]);

  const startMission = () => {
    finish();
    router.push(FIRST_MISSION_HREF);
  };

  const exploreWithSample = async () => {
    setLoadingSample(true);
    try {
      const { loadSampleData } = await import("@/lib/data/sample-data");
      await loadSampleData();
      setOfferSample(false);
      setIndex(1);
    } finally {
      setLoadingSample(false);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      finish();
      return;
    }
    if (event.key !== "Tab") return;
    // Keep focus inside the card: the rest of the page is dimmed and closed to
    // the pointer, so it should be closed to the keyboard too.
    const focusable = cardRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])");
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const spot = anchorRect && inflate(anchorRect, 8);
  const plainButton = "text-sm px-2 py-1 rounded hover:bg-v2-bg-overlay";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[70]"
    >
      {/* The dim layer. With a target it is the spotlight's enormous shadow,
          which leaves a clear hole; without one, a plain scrim. Either way the
          map stays visible behind it. */}
      {spot ? (
        <div
          aria-hidden="true"
          className="tour-spot absolute rounded-xl pointer-events-none"
          style={{
            left: spot.x,
            top: spot.y,
            width: spot.width,
            height: spot.height,
            boxShadow:
              "0 0 0 200vmax rgba(5, 5, 8, 0.8), 0 0 0 2px var(--color-v2-cyan), 0 0 24px 2px var(--color-v2-cyan-glow)",
          }}
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "rgba(5, 5, 8, 0.72)" }} />
      )}

      <div
        ref={cardRef}
        className={`${canGlide ? "tour-card " : ""}absolute w-[360px] max-w-[calc(100vw-24px)] rounded-xl p-5`}
        style={{
          left: placement?.left ?? 0,
          top: placement?.top ?? 0,
          visibility: placement ? "visible" : "hidden",
          background: "var(--color-v2-bg-elevated)",
          border: "1px solid color-mix(in srgb, var(--color-v2-cyan) 45%, transparent)",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.6)",
        }}
      >
        {!isWelcome && (
          <p
            className="telemetry-font text-[11px] tracking-widest mb-2"
            style={{ color: "var(--color-v2-amber-bright)" }}
          >
            STEP {index} OF {STEPS.length - 1}
          </p>
        )}
        <h2 id={titleId} className="display-font text-lg tracking-wider mb-3" style={{ color: "var(--color-v2-cyan)" }}>
          {step.title}
        </h2>
        <p id={bodyId} className="text-sm leading-relaxed mb-5" style={{ color: "var(--color-v2-text)" }}>
          {step.body}
        </p>

        {isWelcome ? (
          <div className="flex flex-col gap-2">
            <ActionButton ref={primaryRef} variant="primary" onClick={() => setIndex(1)} disabled={loadingSample}>
              Show me around
            </ActionButton>
            {offerSample && (
              <ActionButton variant="secondary" onClick={exploreWithSample} disabled={loadingSample}>
                {loadingSample ? "Loading sample progress…" : "Explore with sample progress"}
              </ActionButton>
            )}
            <button
              onClick={finish}
              className="text-sm py-1 underline underline-offset-4 decoration-dotted hover:decoration-solid"
              style={{ color: "var(--color-v2-text)" }}
            >
              Skip the tour
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setIndex(index - 1)}
              className={plainButton}
              style={{ color: "var(--color-v2-text)" }}
            >
              ← Back
            </button>
            <div className="flex items-center gap-2">
              {isLast ? (
                <>
                  <ActionButton variant="secondary" size="sm" onClick={finish}>
                    Explore on my own
                  </ActionButton>
                  <ActionButton ref={primaryRef} variant="primary" size="sm" onClick={startMission}>
                    Start Mission 1 →
                  </ActionButton>
                </>
              ) : (
                <>
                  <button onClick={finish} className={plainButton} style={{ color: "var(--color-v2-text)" }}>
                    Skip
                  </button>
                  <ActionButton ref={primaryRef} variant="primary" size="sm" onClick={() => setIndex(index + 1)}>
                    Next
                  </ActionButton>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
