"use client";

import { useReducedMotion } from "@/lib/use-reduced-motion";

interface PathNode {
  missionId: string;
  cx: number;
  cy: number;
}

interface CampaignPathProps {
  nodes: PathNode[];
  currentMissionIndex: number;
  pathColor: string;
}

/** Animated energy stream between two mission nodes — bezier curve with flowing particles */
function MissionStream({
  x1, y1, x2, y2,
  color,
  isCompleted,
  segmentIndex,
}: {
  x1: number; y1: number; x2: number; y2: number;
  color: string;
  isCompleted: boolean;
  segmentIndex: number;
}) {
  const reducedMotion = useReducedMotion();
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / len;
  const ny = dx / len;
  const curve = len * 0.2;

  // Offset control points perpendicular to the line for a nice curve
  const cp1x = x1 + dx * 0.3 + nx * curve;
  const cp1y = y1 + dy * 0.3 + ny * curve;
  const cp2x = x1 + dx * 0.7 - nx * curve * 0.5;
  const cp2y = y1 + dy * 0.7 - ny * curve * 0.5;

  const pathD = `M${x1},${y1} C${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;

  return (
    <g>
      {/* Glow layer */}
      <path
        d={pathD}
        fill="none"
        stroke={isCompleted ? color : "#7a8298"}
        strokeWidth={isCompleted ? 4 : 2}
        opacity={isCompleted ? 0.06 : 0.02}
        strokeLinecap="round"
      />
      {/* Base path */}
      <path
        d={pathD}
        fill="none"
        stroke={isCompleted ? color : "#7a8298"}
        strokeWidth={isCompleted ? 1.5 : 0.8}
        opacity={isCompleted ? 0.5 : 0.15}
        strokeLinecap="round"
        strokeDasharray={isCompleted ? "none" : "4 6"}
      />
      {/* Animated particles — 3 per stream. Decorative: reduced motion drops them. */}
      {!reducedMotion && [0, 1, 2].map((i) => (
        <circle
          key={i}
          r={isCompleted ? 2 : 1.2}
          fill={isCompleted ? color : "#7a8298"}
          opacity={0}
        >
          <animateMotion
            dur={`${3 + i * 1.5}s`}
            repeatCount="indefinite"
            begin={`${i * 1.2 + segmentIndex * 0.3}s`}
            path={pathD}
          />
          <animate
            attributeName="opacity"
            values={isCompleted ? "0;0.7;0.7;0" : "0;0.2;0.2;0"}
            dur={`${3 + i * 1.5}s`}
            repeatCount="indefinite"
            begin={`${i * 1.2 + segmentIndex * 0.3}s`}
          />
        </circle>
      ))}
    </g>
  );
}

export default function CampaignPath({ nodes, currentMissionIndex, pathColor }: CampaignPathProps) {
  if (nodes.length < 2) return null;

  return (
    <g>
      {/* Path segments connecting sequential missions */}
      {nodes.map((node, i) => {
        if (i === 0) return null;
        const prev = nodes[i - 1];
        const isCompleted = i <= currentMissionIndex;

        return (
          <MissionStream
            key={`path-${prev.missionId}-${node.missionId}`}
            x1={prev.cx}
            y1={prev.cy}
            x2={node.cx}
            y2={node.cy}
            color={pathColor}
            isCompleted={isCompleted}
            segmentIndex={i}
          />
        );
      })}

      {/* "You are here" pulse marker on current mission */}
      {currentMissionIndex >= 0 && currentMissionIndex < nodes.length && (
        <>
          <circle
            cx={nodes[currentMissionIndex].cx}
            cy={nodes[currentMissionIndex].cy}
            r={8}
            fill="none"
            stroke={pathColor}
            strokeWidth={1}
            opacity={0.3}
            className="animate-[availablePulse_2s_ease-in-out_infinite]"
          />
          <circle
            cx={nodes[currentMissionIndex].cx}
            cy={nodes[currentMissionIndex].cy}
            r={5}
            fill="none"
            stroke={pathColor}
            strokeWidth={1.5}
            opacity={0.8}
            className="animate-[availablePulse_2s_ease-in-out_infinite]"
          />
        </>
      )}
    </g>
  );
}
