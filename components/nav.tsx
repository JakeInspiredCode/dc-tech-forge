"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { requestTour } from "@/lib/tour/request";

// `hint` says in plain words what each themed name is for. It is the tooltip
// and part of the accessible name.
const NAV_ITEMS = [
  { href: "/", label: "Galaxy Map", hint: "your curriculum", icon: "✦", color: "var(--color-v2-cyan)" },
  { href: "/missions", label: "Missions", hint: "guided lessons", icon: "◆", color: "var(--color-v2-amber)" },
  { href: "/arsenal", label: "Arsenal", hint: "practice drills and tools", icon: "⬡", color: "var(--color-v2-green)" },
  { href: "/battle-station", label: "Battlestation", hint: "live ticket simulator", icon: "⚡", color: "var(--color-v2-danger)" },
  { href: "/profile", label: "Profile", hint: "progress and settings", icon: "▲", color: "var(--color-v2-silver)" },
];

// Sub-routes that should highlight each hub
const HUB_ROUTES: Record<string, string[]> = {
  "/missions": ["/missions", "/study"],
  "/arsenal": ["/arsenal", "/train", "/explore", "/foundations", "/terminal", "/cards", "/drill", "/filesystem-navigator", "/command-dissector", "/filesystem-types", "/boot-learn", "/boot-triage", "/train/quick-draw", "/train/diagnosis", "/explore/boot-process", "/explore/visual-explorer", "/stories"],
  "/profile": ["/profile", "/progress"],
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  const children = HUB_ROUTES[href];
  if (children) return children.some((r) => pathname === r || pathname.startsWith(r + "/"));
  return pathname.startsWith(href);
}

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{
        background: "rgba(5, 5, 8, 0.85)",
        // An inset shadow, not a border: a border made the nav 57px while
        // --chrome-h says 56, so every full-height page overflowed by 1px
        // and grew a scrollbar.
        boxShadow: "inset 0 -1px 0 var(--color-v2-border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/" aria-label={`${BRAND.name} home`} className="flex items-center gap-2 shrink-0">
            <span
              className="mono font-bold text-lg tracking-wider"
              style={{ color: "var(--color-v2-cyan)" }}
            >
              {/* Measured: beside the labelled tabs, the full wordmark needs
                  ~830px of viewport. Below lg, use the compact mark. */}
              <span className="lg:hidden">{BRAND.shortMark}</span>
              <span className="hidden lg:inline">{BRAND.wordmark}</span>
            </span>
          </Link>
          <div data-tour="nav-tabs" className="flex items-center gap-1 sm:gap-1.5 ml-4 flex-1 justify-center">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={`${item.label} — ${item.hint}`}
                  title={`${item.label} — ${item.hint}`}
                  aria-current={active ? "page" : undefined}
                  className="nav-tab relative px-3 sm:px-4 py-2 rounded text-sm transition-all duration-150 flex items-center gap-2"
                  style={{
                    color: active ? item.color : "var(--color-v2-text-dim)",
                    background: active ? `color-mix(in srgb, ${item.color} 12%, transparent)` : "transparent",
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontWeight: active ? 600 : 500,
                    letterSpacing: "0.04em",
                  }}
                >
                  <span className="text-xs">{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                  {active && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
                      style={{
                        width: "60%",
                        background: item.color,
                        boxShadow: `0 0 8px ${item.color}`,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
          <button
            onClick={() => {
              // The tour points at the Galaxy Map, so it runs there.
              requestTour();
              if (pathname !== "/") router.push("/");
            }}
            title="Replay the tour"
            className="ml-2 px-2.5 h-8 flex items-center gap-1 rounded transition-colors text-xs shrink-0"
            style={{
              color: "var(--color-v2-text-muted)",
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <span>?</span>
            <span className="hidden sm:inline">Guide</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
