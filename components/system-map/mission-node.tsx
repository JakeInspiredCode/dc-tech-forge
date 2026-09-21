"use client";

import type { Mission, MissionStatus } from "@/lib/types/campaign";
import { MISSION_NODE_COLORS } from "@/lib/design/forge-v2-tokens";

interface MissionNodeProps {
  mission: Mission;
  missionIndex: number;
  totalMissions: number;
  status: MissionStatus;
  cx: number;
  cy: number;
  size: number;
  celestialType: "asteroid" | "moon" | "planet" | "station";
  campaignColor: string;
  isCurrent: boolean;
  isHovered: boolean;
  /** `at` anchors the tooltip when there is no cursor (keyboard focus). */
  onHover: (mission: Mission | null, at?: { x: number; y: number }) => void;
  onClick: (mission: Mission) => void;
}

const STATUS_WORDS: Record<MissionStatus, string> = {
  locked: "locked",
  available: "not started",
  "in-progress": "in progress",
  accomplished: "completed",
  decaying: "needs review",
};

// Deterministic hash from mission id — consistent per-planet look
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Planet surface color palettes — each planet gets a unique combo
const SURFACE_PALETTES = [
  { base: "#1a6b8a", mid: "#2d9bb5", light: "#5cc8e0" },  // ocean world
  { base: "#8b4513", mid: "#cd853f", light: "#deb887" },  // desert
  { base: "#2d5a27", mid: "#4a8c3f", light: "#7bc96f" },  // forest
  { base: "#6b3a7a", mid: "#9b59b6", light: "#c39bd3" },  // purple gas
  { base: "#8b0000", mid: "#cd5c5c", light: "#f08080" },  // mars-like
  { base: "#1c3d5a", mid: "#2e6b9e", light: "#5dade2" },  // ice giant
  { base: "#b8860b", mid: "#daa520", light: "#f4d03f" },  // golden gas
  { base: "#3a5f3a", mid: "#5f8a5f", light: "#88bb88" },  // mossy
  { base: "#4a4a6a", mid: "#6a6a8a", light: "#9a9aba" },  // grey rock
  { base: "#7a3b2e", mid: "#a0522d", light: "#d2691e" },  // volcanic
  { base: "#2a4a6a", mid: "#4682b4", light: "#87ceeb" },  // gas blue
  { base: "#5a3a5a", mid: "#8a5a8a", light: "#ba8aba" },  // lavender gas
];

export default function MissionNode({
  mission,
  missionIndex,
  totalMissions,
  status,
  cx,
  cy,
  size,
  celestialType,
  campaignColor,
  isCurrent,
  isHovered,
  onHover,
  onClick,
}: MissionNodeProps) {
  const colors = MISSION_NODE_COLORS[status];
  const isLocked = status === "locked";
  const isInteractive = !isLocked;
  const isAccomplished = status === "accomplished";
  const showHoverAffordance = isHovered && isInteractive;

  const h = hashId(mission.id);
  const palette = SURFACE_PALETTES[h % SURFACE_PALETTES.length];
  const orbitRadius = Math.sqrt((cx - 500) ** 2 + (cy - 380) ** 2);

  // Some planets get moons
  const hasMoon = !isLocked && (celestialType === "planet" || celestialType === "station") && h % 3 === 0;
  const moonAngle = (h % 360) * (Math.PI / 180);
  const moonDist = size + 6 + (h % 4);
  const moonSize = 2 + (h % 2);

  // Animation
  let animClass = "";
  if (status === "available") animClass = "animate-[availablePulse_2s_ease-in-out_infinite]";
  if (status === "decaying") animClass = "animate-[decayPulse_2s_ease-in-out_infinite]";
  if (isCurrent) animClass = "animate-[territoryPulse_2s_ease-in-out_infinite]";

  const lockedOpacity = 0.5;

  // Orbit ring styling — campaign color, not grey
  const orbitColor = isLocked ? "#3a4258" : campaignColor;
  const orbitOpacity = isCurrent ? 0.25 : isLocked ? 0.08 : 0.12;
  const orbitDash = isLocked ? "2 6" : isCurrent ? "none" : "2 4";
  const orbitWidth = isCurrent ? 0.8 : 0.4;

  return (
    <g
      className={`${isInteractive ? "cursor-pointer sector-node map-node" : "cursor-default"} transition-transform duration-200`}
      role={isInteractive ? "link" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`Mission ${missionIndex + 1} of ${totalMissions}: ${mission.title}, ${STATUS_WORDS[status]}${isCurrent ? ", up next" : ""}. Open mission.`}
      aria-current={isCurrent ? "step" : undefined}
      onMouseEnter={() => isInteractive && onHover(mission)}
      onMouseLeave={() => onHover(null)}
      onFocus={(e) => {
        if (!isInteractive) return;
        const box = e.currentTarget.getBoundingClientRect();
        onHover(mission, { x: box.right, y: box.top });
      }}
      onBlur={() => onHover(null)}
      onClick={() => isInteractive && onClick(mission)}
      onKeyDown={(e) => {
        if (isInteractive && e.key === "Enter") {
          e.preventDefault();
          onClick(mission);
        }
      }}
      style={{
        ["--sector-color" as string]: colors.stroke,
        ...(colors.glow !== "none" ? { filter: `drop-shadow(0 0 10px ${colors.glow})` } : {}),
      }}
    >
      {/* Invisible hit area */}
      <circle cx={cx} cy={cy} r={Math.max(size + 10, 20)} fill="transparent" />

      {/* Orbit ring — campaign-colored */}
      <circle
        cx={500} cy={380} r={orbitRadius}
        fill="none" stroke={orbitColor}
        strokeWidth={orbitWidth} opacity={orbitOpacity}
        strokeDasharray={orbitDash}
      />

      {/* Keyboard focus ring (see .map-node in globals.css) */}
      {isInteractive && (
        <circle
          className="map-focus-ring"
          cx={cx} cy={cy} r={size + 9}
          fill="none" stroke="#22f5ee" strokeWidth={2}
        />
      )}

      {/* Hover affordance — pulsing target ring around the planet */}
      {showHoverAffordance && (
        <>
          <circle
            cx={cx} cy={cy} r={size + 8}
            fill={`${campaignColor}10`}
            stroke={campaignColor}
            strokeWidth={1.5}
            opacity={0.7}
            strokeDasharray="3 3"
            style={{ filter: `drop-shadow(0 0 8px ${campaignColor})` }}
          >
            <animate
              attributeName="r"
              values={`${size + 6};${size + 11};${size + 6}`}
              dur="1.6s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.4;0.85;0.4"
              dur="1.6s"
              repeatCount="indefinite"
            />
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${cx} ${cy}`}
              to={`360 ${cx} ${cy}`}
              dur="8s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Outer halo */}
          <circle
            cx={cx} cy={cy} r={size + 16}
            fill="none"
            stroke={campaignColor}
            strokeWidth={0.6}
            opacity={0.25}
          />
        </>
      )}

      {/* ─── ASTEROID ─── */}
      {celestialType === "asteroid" && (
        <>
          <polygon
            points={asteroidPoints(cx, cy, size)}
            fill={isLocked ? "#1e2538" : palette.base}
            stroke={isLocked ? "#3a4258" : palette.mid}
            strokeWidth={0.8}
            opacity={isLocked ? lockedOpacity : 0.9}
            className={animClass}
          />
          {/* Surface craters */}
          {!isLocked && (
            <>
              <circle cx={cx - size * 0.2} cy={cy + size * 0.1} r={size * 0.15} fill={palette.base} opacity={0.5} />
              <circle cx={cx + size * 0.25} cy={cy - size * 0.15} r={size * 0.1} fill={palette.base} opacity={0.4} />
            </>
          )}
        </>
      )}

      {/* ─── MOON / ROCKY WORLD ─── */}
      {celestialType === "moon" && (
        <>
          <circle
            cx={cx} cy={cy} r={size}
            fill={isLocked ? "#1e2538" : `url(#rocky-${mission.id})`}
            stroke={isLocked ? "#3a4258" : palette.mid}
            strokeWidth={0.8}
            opacity={isLocked ? lockedOpacity : 1}
            className={animClass}
          />
          {/* Terminator shadow — day/night line */}
          {!isLocked && (
            <ellipse
              cx={cx + size * 0.3} cy={cy}
              rx={size * 0.7} ry={size}
              fill="rgba(0,0,0,0.3)"
              clipPath={`circle(${size}px at ${cx}px ${cy}px)`}
            />
          )}
          {/* Specular highlight */}
          {!isLocked && (
            <ellipse
              cx={cx - size * 0.3} cy={cy - size * 0.3}
              rx={size * 0.35} ry={size * 0.25}
              fill="rgba(255,255,255,0.12)"
            />
          )}
          <defs>
            <radialGradient id={`rocky-${mission.id}`} cx="35%" cy="35%">
              <stop offset="0%" stopColor={palette.light} />
              <stop offset="50%" stopColor={palette.mid} />
              <stop offset="100%" stopColor={palette.base} />
            </radialGradient>
          </defs>
        </>
      )}

      {/* ─── PLANET / TERRESTRIAL ─── */}
      {celestialType === "planet" && (
        <>
          {/* Atmosphere haze */}
          {!isLocked && (
            <circle
              cx={cx} cy={cy} r={size + 3}
              fill="none" stroke={palette.light}
              strokeWidth={1.5} opacity={0.1}
            />
          )}
          {/* Planet body */}
          <circle
            cx={cx} cy={cy} r={size}
            fill={isLocked ? "#1e2538" : `url(#globe-${mission.id})`}
            stroke={isLocked ? "#3a4258" : palette.mid}
            strokeWidth={1}
            opacity={isLocked ? lockedOpacity : 1}
            className={animClass}
          />
          {/* Surface band lines — gas giant stripes or continental hints */}
          {!isLocked && size >= 14 && (
            <>
              <ellipse cx={cx} cy={cy - size * 0.3} rx={size * 0.9} ry={size * 0.08} fill={palette.light} opacity={0.12} />
              <ellipse cx={cx} cy={cy + size * 0.15} rx={size * 0.95} ry={size * 0.06} fill={palette.base} opacity={0.15} />
              <ellipse cx={cx} cy={cy + size * 0.5} rx={size * 0.8} ry={size * 0.05} fill={palette.light} opacity={0.08} />
            </>
          )}
          {/* 3D specular */}
          {!isLocked && (
            <ellipse
              cx={cx - size * 0.25} cy={cy - size * 0.25}
              rx={size * 0.4} ry={size * 0.3}
              fill="rgba(255,255,255,0.1)"
            />
          )}
          <defs>
            <radialGradient id={`globe-${mission.id}`} cx="38%" cy="32%">
              <stop offset="0%" stopColor={palette.light} stopOpacity={0.9} />
              <stop offset="40%" stopColor={palette.mid} />
              <stop offset="100%" stopColor={palette.base} />
            </radialGradient>
          </defs>
        </>
      )}

      {/* ─── STATION / GAS GIANT WITH RINGS ─── */}
      {celestialType === "station" && (
        <>
          {/* Outer atmosphere */}
          {!isLocked && (
            <circle
              cx={cx} cy={cy} r={size + 5}
              fill={`url(#atmo-${mission.id})`}
            />
          )}
          {/* Planet body */}
          <circle
            cx={cx} cy={cy} r={size}
            fill={isLocked ? "#1e2538" : `url(#giant-${mission.id})`}
            stroke={isLocked ? "#3a4258" : palette.mid}
            strokeWidth={1.2}
            opacity={isLocked ? lockedOpacity : 1}
            className={animClass}
          />
          {/* Gas band stripes */}
          {!isLocked && (
            <>
              <ellipse cx={cx} cy={cy - size * 0.4} rx={size * 0.95} ry={size * 0.07} fill={palette.light} opacity={0.15} />
              <ellipse cx={cx} cy={cy - size * 0.1} rx={size} ry={size * 0.05} fill={palette.base} opacity={0.2} />
              <ellipse cx={cx} cy={cy + size * 0.2} rx={size * 0.9} ry={size * 0.06} fill={palette.light} opacity={0.1} />
              <ellipse cx={cx} cy={cy + size * 0.5} rx={size * 0.85} ry={size * 0.05} fill={palette.mid} opacity={0.12} />
            </>
          )}
          {/* Ring system */}
          <ellipse
            cx={cx} cy={cy}
            rx={size * 1.6} ry={size * 0.35}
            fill="none"
            stroke={isLocked ? "#3a4258" : palette.light}
            strokeWidth={isLocked ? 0.5 : 2}
            opacity={isLocked ? 0.1 : 0.25}
          />
          <ellipse
            cx={cx} cy={cy}
            rx={size * 1.45} ry={size * 0.3}
            fill="none"
            stroke={isLocked ? "#3a4258" : palette.mid}
            strokeWidth={isLocked ? 0.3 : 1}
            opacity={isLocked ? 0.08 : 0.15}
          />
          {/* Specular */}
          {!isLocked && (
            <ellipse
              cx={cx - size * 0.2} cy={cy - size * 0.25}
              rx={size * 0.35} ry={size * 0.25}
              fill="rgba(255,255,255,0.08)"
            />
          )}
          <defs>
            <radialGradient id={`giant-${mission.id}`} cx="40%" cy="35%">
              <stop offset="0%" stopColor={palette.light} stopOpacity={0.8} />
              <stop offset="35%" stopColor={palette.mid} />
              <stop offset="100%" stopColor={palette.base} />
            </radialGradient>
            <radialGradient id={`atmo-${mission.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor={palette.light} stopOpacity={0} />
              <stop offset="90%" stopColor={palette.light} stopOpacity={0.06} />
              <stop offset="100%" stopColor={palette.light} stopOpacity={0} />
            </radialGradient>
          </defs>
        </>
      )}

      {/* ─── ORBITING MOON (small satellite) ─── */}
      {hasMoon && (
        <g>
          {/* Moon orbit track */}
          <circle
            cx={cx} cy={cy} r={moonDist}
            fill="none" stroke={palette.mid}
            strokeWidth={0.3} opacity={0.15}
            strokeDasharray="1 3"
          />
          {/* Moon body */}
          <circle
            cx={cx + Math.cos(moonAngle) * moonDist}
            cy={cy + Math.sin(moonAngle) * moonDist}
            r={moonSize}
            fill={palette.mid}
            opacity={0.6}
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${cx} ${cy}`}
              to={`360 ${cx} ${cy}`}
              dur={`${8 + (h % 6)}s`}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      )}

      {/* Mission title */}
      <text
        x={cx}
        y={cy + size + (hasMoon ? 13 : 11)}
        textAnchor="middle"
        dominantBaseline="hanging"
        fill={isLocked ? "#8eafc8" : "#e0e4ec"}
        fontSize={12}
        fontFamily="'Chakra Petch', sans-serif"
        fontWeight={600}
        letterSpacing="0.08em"
        className="pointer-events-none select-none"
        style={{ textShadow: isLocked ? "none" : "0 0 6px rgba(0,0,0,0.8)" }}
      >
        {mission.title.length > 22 ? mission.title.slice(0, 20) + "…" : mission.title}
      </text>

      {/* Mission number sub-label */}
      <text
        x={cx}
        y={cy + size + (hasMoon ? 28 : 26)}
        textAnchor="middle"
        dominantBaseline="hanging"
        fill="#8eafc8"
        fontSize={9}
        fontFamily="'JetBrains Mono', monospace"
        className="pointer-events-none select-none"
        style={{ textShadow: "0 0 4px rgba(0,0,0,0.6)" }}
      >
        {missionIndex + 1}
      </text>

      {/* Accomplished indicator */}
      {isAccomplished && (
        <circle
          cx={cx + size - 1} cy={cy - size + 1} r={3}
          fill="#22c55e"
          style={{ filter: "drop-shadow(0 0 4px #22c55e)" }}
        />
      )}

      {/* Hover-state Deploy hint — anchored above the planet so it stays
          readable regardless of orbit position */}
      {showHoverAffordance && (
        <g className="pointer-events-none select-none">
          <rect
            x={cx - 36}
            y={cy - size - 24}
            width={72}
            height={16}
            rx={8}
            ry={8}
            fill="#0b1220"
            stroke={campaignColor}
            strokeWidth={1}
            opacity={0.95}
            style={{ filter: `drop-shadow(0 0 6px ${campaignColor}aa)` }}
          />
          <text
            x={cx}
            y={cy - size - 16}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={campaignColor}
            fontSize={10}
            fontFamily="'Chakra Petch', sans-serif"
            fontWeight={700}
            letterSpacing="0.18em"
            className="uppercase"
            style={{ textShadow: `0 0 6px ${campaignColor}cc` }}
          >
            ▶ Deploy
          </text>
        </g>
      )}
    </g>
  );
}

function asteroidPoints(cx: number, cy: number, size: number): string {
  const points = 7;
  const coords: string[] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
    const r = size * (0.7 + Math.sin(i * 2.7) * 0.3);
    coords.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`);
  }
  return coords.join(" ");
}
