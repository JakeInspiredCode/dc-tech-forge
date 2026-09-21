"use client";

import { useState } from "react";
import { onActivate } from "@/lib/a11y";

type EdgeKind = "requires" | "wants" | "after";

interface UnitNode {
  id: string;
  label: string;
  kind: "target" | "service";
  x: number;
  y: number;
  desc: string;
}

interface UnitEdge {
  from: string;
  to: string;
  kind: EdgeKind;
}

const NODES: UnitNode[] = [
  { id: "graphical", label: "graphical.target", kind: "target", x: 50, y: 8,
    desc: "GUI login prompt. Wants multi-user.target." },
  { id: "multi-user", label: "multi-user.target", kind: "target", x: 50, y: 24,
    desc: "Normal server boot: all services, no GUI. Wants basic.target." },
  { id: "basic", label: "basic.target", kind: "target", x: 50, y: 40,
    desc: "Core system primitives: paths, sockets, timers, slices, mounts." },
  { id: "sysinit", label: "sysinit.target", kind: "target", x: 50, y: 56,
    desc: "Early init: filesystems mounted, kernel modules loaded, swap active." },
  { id: "network-online", label: "network-online.target", kind: "target", x: 22, y: 40,
    desc: "Network is actually up (carrier, routes, often DNS). Wait for this if your service makes outbound calls at start." },
  { id: "sshd", label: "sshd.service", kind: "service", x: 22, y: 24,
    desc: "OpenSSH daemon. Wants network-online.target, After basic.target." },
  { id: "nginx", label: "nginx.service", kind: "service", x: 78, y: 24,
    desc: "Web server. Requires network.target, After multi-user.target." },
  { id: "postgres", label: "postgresql.service", kind: "service", x: 78, y: 40,
    desc: "Database. Data volumes mounted via After=local-fs.target." },
];

const EDGES: UnitEdge[] = [
  { from: "graphical", to: "multi-user", kind: "wants" },
  { from: "multi-user", to: "basic", kind: "wants" },
  { from: "basic", to: "sysinit", kind: "requires" },
  { from: "sshd", to: "network-online", kind: "wants" },
  { from: "sshd", to: "basic", kind: "after" },
  { from: "multi-user", to: "sshd", kind: "wants" },
  { from: "nginx", to: "multi-user", kind: "after" },
  { from: "nginx", to: "postgres", kind: "requires" },
  { from: "postgres", to: "basic", kind: "after" },
  { from: "network-online", to: "basic", kind: "after" },
];

const EDGE_COLORS: Record<EdgeKind, string> = {
  requires: "#FF6B6B",
  wants: "#FFA832",
  after: "#50C8FF",
};

const EDGE_LABELS: Record<EdgeKind, string> = {
  requires: "Requires (hard dep)",
  wants: "Wants (soft dep)",
  after: "After (ordering)",
};

export default function SystemdUnitGraph({
  title,
  caption,
}: {
  title?: string;
  caption?: string;
}) {
  const [selected, setSelected] = useState<string | null>("nginx");

  const selectedNode = NODES.find((n) => n.id === selected);
  const relevantEdges = EDGES.filter(
    (e) => selected && (e.from === selected || e.to === selected)
  );

  return (
    <div
      style={{
        margin: "18px 0",
        padding: "16px 18px",
        background: "rgba(80,200,255,0.04)",
        border: "1px solid rgba(80,200,255,0.18)",
        borderRadius: 10,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "#50C8FF",
          letterSpacing: "0.5px",
          marginBottom: 6,
          textTransform: "uppercase",
        }}
      >
        ◉ Interactive — systemd dependency graph
      </div>
      {title && (
        <div style={{ color: "#E0E4E8", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
          {title}
        </div>
      )}
      {caption && (
        <div style={{ color: "#B8C4D8", fontSize: 11, lineHeight: 1.5, marginBottom: 10 }}>
          {caption}
        </div>
      )}

      <svg
        viewBox="0 0 100 72"
        style={{ width: "100%", height: "auto", maxHeight: 360, display: "block" }}
      >
        {/* edges */}
        {EDGES.map((e, i) => {
          const from = NODES.find((n) => n.id === e.from)!;
          const to = NODES.find((n) => n.id === e.to)!;
          const isHighlighted =
            selected && (e.from === selected || e.to === selected);
          return (
            <g key={i}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={EDGE_COLORS[e.kind]}
                strokeWidth={isHighlighted ? 0.6 : 0.25}
                strokeOpacity={isHighlighted ? 0.9 : 0.35}
                strokeDasharray={e.kind === "after" ? "1 1" : undefined}
              />
            </g>
          );
        })}
        {/* nodes */}
        {NODES.map((n) => {
          const isSelected = selected === n.id;
          const isRelated =
            selected &&
            EDGES.some(
              (e) =>
                (e.from === selected && e.to === n.id) ||
                (e.to === selected && e.from === n.id)
            );
          const fill =
            n.kind === "target" ? "rgba(197,138,255,0.18)" : "rgba(80,200,255,0.15)";
          const stroke =
            isSelected ? "#FFA832" : isRelated ? "#50C8FF" : n.kind === "target" ? "#C58AFF" : "#50C8FF";
          return (
            <g
              key={n.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`${n.id} (${n.kind})`}
              onClick={() => setSelected(n.id)}
              onKeyDown={onActivate(() => setSelected(n.id))}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={n.x - 12}
                y={n.y - 2.5}
                width={24}
                height={5}
                rx={1.2}
                ry={1.2}
                fill={fill}
                stroke={stroke}
                strokeWidth={isSelected ? 0.8 : 0.3}
              />
              <text
                x={n.x}
                y={n.y + 1}
                textAnchor="middle"
                fontSize={2.2}
                fill={isSelected ? "#FFF" : "#D8DCE0"}
                fontFamily="'JetBrains Mono', monospace"
                fontWeight={isSelected ? 700 : 500}
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* legend */}
      <div
        style={{
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          marginTop: 8,
          marginBottom: 10,
          fontSize: 10,
          color: "#B8C4D8",
        }}
      >
        {(["requires", "wants", "after"] as EdgeKind[]).map((k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                width: 14,
                height: 2,
                background: EDGE_COLORS[k],
                borderTop: k === "after" ? `1px dashed ${EDGE_COLORS[k]}` : "none",
                display: "inline-block",
              }}
            />
            <span>{EDGE_LABELS[k]}</span>
          </div>
        ))}
      </div>

      {/* detail panel */}
      {selectedNode && (
        <div
          style={{
            padding: "10px 12px",
            background: "rgba(0,0,0,0.25)",
            borderLeft: `3px solid ${selectedNode.kind === "target" ? "#C58AFF" : "#50C8FF"}`,
            borderRadius: 6,
          }}
        >
          <div
            style={{
              color: selectedNode.kind === "target" ? "#C58AFF" : "#50C8FF",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 4,
            }}
          >
            {selectedNode.label} ({selectedNode.kind})
          </div>
          <div style={{ color: "#D8DCE0", fontSize: 11, lineHeight: 1.5, marginBottom: 6 }}>
            {selectedNode.desc}
          </div>
          {relevantEdges.length > 0 && (
            <div style={{ display: "grid", gap: 3, marginTop: 6 }}>
              {relevantEdges.map((e, i) => {
                const isSource = e.from === selected;
                const other = NODES.find((n) => n.id === (isSource ? e.to : e.from));
                return (
                  <div key={i} style={{ fontSize: 10, color: "#B8C4D8" }}>
                    <span style={{ color: EDGE_COLORS[e.kind], fontWeight: 700 }}>
                      {isSource ? "→ " : "← "}
                      {EDGE_LABELS[e.kind]}
                    </span>{" "}
                    <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {other?.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
