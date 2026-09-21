"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { requestTour } from "@/lib/tour/request";

// `hint` says in plain words what each themed name is for. It is the tooltip
// and part of the accessible name. `short` is what fits under the icon on a
// phone — five tabs share ~290px — and is only ever a clipping of `label`.
const NAV_ITEMS = [
  { href: "/", label: "Galaxy Map", short: "Map", hint: "your curriculum", icon: "✦", color: "var(--color-v2-cyan)" },
  { href: "/missions", label: "Missions", short: "Missions", hint: "guided lessons", icon: "◆", color: "var(--color-v2-amber)" },
  { href: "/arsenal", label: "Arsenal", short: "Arsenal", hint: "practice drills and tools", icon: "⬡", color: "var(--color-v2-green)" },
  { href: "/battle-station", label: "Battlestation", short: "Battle", hint: "live ticket simulator", icon: "⚡", color: "var(--color-v2-danger)" },
  { href: "/profile", label: "Profile", short: "Profile", hint: "progress and settings", icon: "▲", color: "var(--color-v2-silver)" },
];

// Sub-routes that should highlight each hub
const HUB_ROUTES: Record<string, string[]> = {
  "/missions": ["/missions"],
  "/arsenal": ["/arsenal", "/study", "/train", "/forge", "/foundations", "/terminal", "/cards", "/drill", "/filesystem-navigator", "/command-dissector", "/filesystem-types", "/boot-learn", "/boot-triage", "/train/quick-draw", "/train/diagnosis", "/stories"],
  "/profile": ["/profile"],
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
          <Link href="/" aria-label={`${BRAND.name} home`} className="hidden sm:flex items-center gap-2 shrink-0">
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
          <div data-tour="nav-tabs" className="flex items-stretch md:items-center gap-0.5 md:gap-1.5 sm:ml-4 flex-1 justify-center min-w-0">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={`${item.label} — ${item.hint}`}
                  title={`${item.label} — ${item.hint}`}
                  aria-current={active ? "page" : undefined}
                  // Below md: icon over a short label, equal widths, 44px tall — a
                  // glyph alone told nobody what "⬡" was. From md: one row.
                  className="nav-tab relative rounded text-sm transition-all duration-150 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 flex-1 md:flex-none min-w-0 min-h-[44px] md:min-h-0 px-1 md:px-4 py-1 md:py-2"
                  style={{
                    color: active ? item.color : "var(--color-v2-text-dim)",
                    background: active ? `color-mix(in srgb, ${item.color} 12%, transparent)` : "transparent",
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontWeight: active ? 600 : 500,
                    letterSpacing: "0.04em",
                  }}
                >
                  <span className="text-xs leading-none" aria-hidden="true">{item.icon}</span>
                  <span className="md:hidden text-[10px] leading-none tracking-normal">{item.short}</span>
                  <span className="hidden md:inline">{item.label}</span>
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
            className="ml-1 md:ml-2 px-2 md:px-2.5 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:h-8 flex flex-col md:flex-row items-center justify-center gap-1 rounded transition-colors text-xs shrink-0"
            style={{
              color: "var(--color-v2-text-muted)",
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <span className="leading-none" aria-hidden="true">?</span>
            <span className="text-[10px] md:text-xs leading-none md:leading-normal">Guide</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
