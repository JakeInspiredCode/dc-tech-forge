import type { ReactNode } from "react";

// The shell for an Arsenal tool that scrolls (as opposed to the fixed-height
// hubs): the app's deep background, a cockpit-style title, and a column of
// glass panels. Deliberately NO animated starfield here — these are screens
// for reading and typing, and motion behind text works against both.
//
// The "← Arsenal / Tool" breadcrumb comes from each tool's layout.tsx.

const WIDTHS = {
  narrow: "max-w-3xl",
  wide: "max-w-5xl",
  full: "max-w-7xl",
} as const;

export default function ToolPage({
  title,
  subtitle,
  width = "narrow",
  actions,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  width?: keyof typeof WIDTHS;
  /** Page-level buttons, shown to the right of the title (below it on a phone). */
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div data-room="arsenal" className="min-h-[calc(100dvh-var(--chrome-h))] bg-v2-bg-deep">
      <div className={`${WIDTHS[width]} mx-auto px-4 sm:px-6 pt-4 pb-12`}>
        <header className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <h1 className="galaxy-title">{title}</h1>
              {subtitle && <p className="text-sm text-v2-text-dim mt-1.5 max-w-prose">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
          </div>
          <div
            aria-hidden="true"
            className="h-px mt-4"
            style={{ background: "linear-gradient(90deg, var(--room-accent), transparent 70%)", opacity: 0.35 }}
          />
        </header>
        {children}
      </div>
    </div>
  );
}
