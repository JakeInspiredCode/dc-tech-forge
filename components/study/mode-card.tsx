"use client";

/** One way to study. A mode with nothing in it stays on screen, inert, and says why. */
export default function ModeCard({
  glyph,
  title,
  description,
  count,
  countLabel,
  color,
  unavailable,
  onStart,
  children,
}: {
  glyph: string;
  title: string;
  description: string;
  count?: number;
  countLabel?: string;
  color: string;
  /** Why it can't be started. Read out as part of the button, so it isn't a mystery to anyone. */
  unavailable?: string;
  onStart: () => void;
  children?: React.ReactNode;
}) {
  const off = unavailable !== undefined;
  return (
    <button
      type="button"
      // aria-disabled, not disabled: a disabled button can't be focused, so a
      // keyboard or screen-reader user would never find out why it is off.
      aria-disabled={off || undefined}
      onClick={off ? undefined : onStart}
      className={`w-full text-left glass-panel rounded-lg p-5 transition-colors ${off ? "cursor-not-allowed" : "v2-btn-glow cursor-pointer"}`}
      style={{ ["--room-accent" as string]: color, ["--room-accent-glow" as string]: `color-mix(in srgb, ${color} 20%, transparent)` }}
    >
      <span className="flex items-start justify-between gap-4">
        <span className="min-w-0">
          <span className="flex items-center gap-2.5">
            <span aria-hidden="true" style={{ color }}>{glyph}</span>
            <span className="display-font text-base text-v2-text">{title}</span>
          </span>
          <span className="block text-sm text-v2-text-dim mt-1.5">{description}</span>
          {off && <span className="block text-sm mt-2" style={{ color: "var(--color-v2-amber-bright)" }}>{unavailable}</span>}
          {children}
        </span>
        {count !== undefined && (
          <span className="shrink-0 text-right">
            <span className="block telemetry-font text-2xl font-semibold" style={{ color: off ? "var(--color-v2-text-muted)" : color }}>
              {count}
            </span>
            {countLabel && <span className="block text-[11px] text-v2-text-muted uppercase tracking-wider">{countLabel}</span>}
          </span>
        )}
      </span>
    </button>
  );
}
