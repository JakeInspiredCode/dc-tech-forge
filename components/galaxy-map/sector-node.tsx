"use client";

import type { Sector, SectorProgress } from "@/lib/types/campaign";

interface SectorNodeProps {
  sector: Sector;
  progress: SectorProgress;
  onHover: (sector: Sector | null) => void;
  onClick: (sector: Sector) => void;
}

const SIZE_SCALE = { sm: 32, md: 42, lg: 56 };
const GLOW_SCALE = { sm: 60, md: 80, lg: 110 };

// Each sector gets a unique planet system — deterministic from sector id
interface Planet {
  orbitRadius: number;  // relative to core radius
  size: number;
  speed: number;        // seconds per revolution
  startAngle: number;
  color: string;
  hasRing: boolean;
}

const SECTOR_PLANETS: Record<string, Planet[]> = {
  "sector-linux": [
    { orbitRadius: 1.5, size: 4, speed: 8, startAngle: 0, color: "#22d3ee", hasRing: false },
    { orbitRadius: 2.0, size: 3, speed: 12, startAngle: 120, color: "#06b6d4", hasRing: true },
    { orbitRadius: 2.6, size: 2.5, speed: 18, startAngle: 240, color: "#67e8f9", hasRing: false },
  ],
  "sector-hardware": [
    { orbitRadius: 1.6, size: 3.5, speed: 10, startAngle: 45, color: "#fbbf24", hasRing: false },
    { orbitRadius: 2.3, size: 4.5, speed: 16, startAngle: 180, color: "#f59e0b", hasRing: true },
  ],
  "sector-networking": [
    { orbitRadius: 1.4, size: 3, speed: 7, startAngle: 30, color: "#60a5fa", hasRing: false },
    { orbitRadius: 1.9, size: 2.5, speed: 11, startAngle: 150, color: "#93c5fd", hasRing: false },
    { orbitRadius: 2.5, size: 3.5, speed: 20, startAngle: 270, color: "#3b82f6", hasRing: true },
    { orbitRadius: 3.0, size: 2, speed: 25, startAngle: 60, color: "#bfdbfe", hasRing: false },
  ],
  "sector-fiber": [
    { orbitRadius: 1.5, size: 2.5, speed: 6, startAngle: 90, color: "#c084fc", hasRing: false },
    { orbitRadius: 2.2, size: 3, speed: 14, startAngle: 210, color: "#a855f7", hasRing: false },
  ],
  "sector-power": [
    { orbitRadius: 1.4, size: 3, speed: 5, startAngle: 0, color: "#f87171", hasRing: false },
    { orbitRadius: 2.0, size: 4, speed: 9, startAngle: 180, color: "#ef4444", hasRing: true },
    { orbitRadius: 2.7, size: 2, speed: 15, startAngle: 90, color: "#fca5a5", hasRing: false },
  ],
  "sector-ops": [
    { orbitRadius: 1.6, size: 3.5, speed: 9, startAngle: 60, color: "#4ade80", hasRing: false },
    { orbitRadius: 2.2, size: 2.5, speed: 13, startAngle: 200, color: "#22c55e", hasRing: false },
  ],
  "sector-scale": [
    { orbitRadius: 1.5, size: 2, speed: 7, startAngle: 45, color: "#f472b6", hasRing: false },
    { orbitRadius: 2.1, size: 3, speed: 11, startAngle: 165, color: "#ec4899", hasRing: true },
    { orbitRadius: 2.7, size: 2.5, speed: 17, startAngle: 285, color: "#f9a8d4", hasRing: false },
  ],
  "sector-linux-advanced": [
    { orbitRadius: 1.5, size: 3, speed: 6, startAngle: 30, color: "#c084fc", hasRing: false },
    { orbitRadius: 2.0, size: 4, speed: 10, startAngle: 150, color: "#a855f7", hasRing: true },
    { orbitRadius: 2.6, size: 2, speed: 16, startAngle: 270, color: "#e9d5ff", hasRing: false },
    { orbitRadius: 3.1, size: 2.5, speed: 22, startAngle: 80, color: "#7c3aed", hasRing: false },
  ],
};

export default function SectorNode({ sector, progress, onHover, onClick }: SectorNodeProps) {
  const r = SIZE_SCALE[sector.size];
  const glowR = GLOW_SCALE[sector.size];
  const cx = sector.mapPosition.x * 10;
  const cy = sector.mapPosition.y * 10;

  const completionPct = progress.totalMissions > 0
    ? progress.completedMissions / progress.totalMissions
    : 0;

  const isActive = progress.hasVolunteered;
  const isComplete = progress.isComplete;

  // Progress ring
  const ringR = r + 5;
  const circumference = 2 * Math.PI * ringR;
  const dashOffset = circumference * (1 - completionPct);

  const planets = SECTOR_PLANETS[sector.id] ?? [];

  // Unique animation delay per sector
  const breatheDelay = `${(cx * 7 + cy * 13) % 4000}ms`;

  return (
    <g
      className="sector-node cursor-pointer"
      data-sector-id={sector.id}
      onMouseEnter={() => onHover(sector)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(sector)}
      style={{
        ["--sector-color" as string]: sector.color,
        filter: `drop-shadow(0 0 ${isActive ? 12 : 6}px ${sector.color}50)`,
      }}
    >
      {/* Outer nebula glow */}
      <circle
        cx={cx} cy={cy} r={glowR}
        fill={`url(#nebula-${sector.id})`}
        opacity={isActive ? 0.35 : 0.18}
        className="sector-breathe"
        style={{ animationDelay: breatheDelay }}
      />

      {/* Orbit track lines for planets */}
      {planets.map((planet, i) => (
        <circle
          key={`orbit-${i}`}
          cx={cx} cy={cy}
          r={r * planet.orbitRadius * 0.55}
          fill="none"
          stroke={sector.color}
          strokeWidth={0.3}
          opacity={isActive ? 0.12 : 0.05}
          strokeDasharray="2 4"
        />
      ))}

      {/* Central star — small and bright */}
      <circle
        cx={cx} cy={cy} r={r * 0.18}
        fill={`url(#star-core-${sector.id})`}
        style={{ filter: `drop-shadow(0 0 8px ${sector.color})` }}
      />
      {/* Hot white center */}
      <circle
        cx={cx} cy={cy} r={r * 0.08}
        fill="#ffffff"
        opacity={0.9}
        className="sector-breathe"
        style={{ animationDelay: breatheDelay }}
      />

      {/* Orbiting planets */}
      {planets.map((planet, i) => {
        const orbitR = r * planet.orbitRadius * 0.55;
        return (
          <g key={`planet-${i}`}>
            {/* Planet body — animated orbit */}
            <circle
              cx={cx + orbitR} cy={cy}
              r={planet.size}
              fill={planet.color}
              opacity={isActive ? 0.85 : 0.5}
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`${planet.startAngle} ${cx} ${cy}`}
                to={`${planet.startAngle + 360} ${cx} ${cy}`}
                dur={`${planet.speed}s`}
                repeatCount="indefinite"
              />
            </circle>
            {/* Ring (Saturn-like) */}
            {planet.hasRing && (
              <ellipse
                cx={cx + orbitR} cy={cy}
                rx={planet.size * 2} ry={planet.size * 0.5}
                fill="none"
                stroke={planet.color}
                strokeWidth={0.6}
                opacity={isActive ? 0.4 : 0.2}
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`${planet.startAngle} ${cx} ${cy}`}
                  to={`${planet.startAngle + 360} ${cx} ${cy}`}
                  dur={`${planet.speed}s`}
                  repeatCount="indefinite"
                />
              </ellipse>
            )}
          </g>
        );
      })}

      {/* Progress ring (only if volunteered) */}
      {isActive && (
        <>
          <circle
            cx={cx} cy={cy} r={ringR}
            fill="none" stroke={sector.color}
            strokeWidth={2.5} opacity={0.1}
          />
          <circle
            cx={cx} cy={cy} r={ringR}
            fill="none"
            stroke={isComplete ? "#22c55e" : sector.color}
            strokeWidth={2.5}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            className="transition-all duration-700"
            style={{ filter: `drop-shadow(0 0 4px ${isComplete ? "#22c55e" : sector.color})` }}
          />
        </>
      )}

      {/* Coming-Soon badge (above the star) */}
      {sector.comingSoon && (
        <g className="pointer-events-none select-none">
          <rect
            x={cx - 48}
            y={cy - r - 22}
            width={96}
            height={18}
            rx={9}
            ry={9}
            fill="#0b1220"
            stroke={sector.color}
            strokeWidth={1.2}
            opacity={0.95}
            style={{ filter: `drop-shadow(0 0 6px ${sector.color}80)` }}
          />
          <text
            x={cx}
            y={cy - r - 13}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={sector.color}
            fontSize={10}
            fontFamily="'Chakra Petch', sans-serif"
            fontWeight={700}
            letterSpacing="0.18em"
            className="uppercase"
          >
            Coming Soon
          </text>
        </g>
      )}

      {/* New-Campaign badge (above the star) — shown when sector is freshly released */}
      {sector.isNew && !sector.comingSoon && (
        <g className="pointer-events-none select-none">
          <rect
            x={cx - 52}
            y={cy - r - 22}
            width={104}
            height={18}
            rx={9}
            ry={9}
            fill="#0b1220"
            stroke="#22c55e"
            strokeWidth={1.4}
            opacity={0.95}
            style={{ filter: `drop-shadow(0 0 7px #22c55ecc)` }}
          >
            <animate
              attributeName="opacity"
              values="0.95;0.65;0.95"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </rect>
          <text
            x={cx}
            y={cy - r - 13}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#22c55e"
            fontSize={10}
            fontFamily="'Chakra Petch', sans-serif"
            fontWeight={800}
            letterSpacing="0.2em"
            className="uppercase"
            style={{ textShadow: "0 0 6px #22c55ecc" }}
          >
            New Campaign
          </text>
        </g>
      )}

      {/* Title — unified size across all sectors */}
      <text
        x={cx}
        y={cy + r + 16}
        textAnchor="middle"
        dominantBaseline="hanging"
        fill={isActive ? sector.color : "#e0e4ec"}
        fontSize={16}
        fontFamily="'Chakra Petch', sans-serif"
        fontWeight={700}
        letterSpacing="0.12em"
        className="pointer-events-none select-none uppercase"
        style={{
          textShadow: isActive ? `0 0 10px ${sector.color}80` : "0 0 6px rgba(0,0,0,0.8)",
        }}
      >
        {sector.title}
      </text>

      {/* Mission count */}
      <text
        x={cx}
        y={cy + r + 38}
        textAnchor="middle"
        dominantBaseline="hanging"
        fill="#b8d4e8"
        fontSize={12}
        fontFamily="'JetBrains Mono', monospace"
        className="pointer-events-none select-none"
        style={{ textShadow: "0 0 4px rgba(0,0,0,0.6)" }}
      >
        {progress.completedMissions}/{progress.totalMissions} missions
      </text>

      {/* Gradient definitions */}
      <defs>
        <radialGradient id={`nebula-${sector.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={sector.color} stopOpacity={0.5} />
          <stop offset="35%" stopColor={sector.color} stopOpacity={0.12} />
          <stop offset="100%" stopColor={sector.color} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`star-core-${sector.id}`} cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
          <stop offset="40%" stopColor={sector.color} stopOpacity={0.95} />
          <stop offset="80%" stopColor={sector.color} stopOpacity={0.6} />
          <stop offset="100%" stopColor={sector.color} stopOpacity={0.2} />
        </radialGradient>
      </defs>
    </g>
  );
}
