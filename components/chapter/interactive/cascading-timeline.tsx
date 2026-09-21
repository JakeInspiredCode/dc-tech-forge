"use client";

import { useState } from "react";

interface Moment {
  t: string;
  tMin: number;
  title: string;
  detail: string;
  severity: "info" | "warn" | "crit";
  amplifier?: string;
  brake?: string;
}

const MOMENTS: Moment[] = [
  {
    t: "T+0",
    tMin: 0,
    title: "DNS resolver returns SERVFAIL",
    detail:
      "One internal resolver briefly fails for a single hostname. Normally a 30-second blip. Nobody notices yet.",
    severity: "info",
  },
  {
    t: "T+2m",
    tMin: 2,
    title: "Clients retry 3× with 100ms spacing",
    detail:
      "Each client retries on failure. Load on the resolver jumps to ~3× normal. The resolver CPU spikes.",
    severity: "warn",
    amplifier: "Retry storm — synchronized retries with no jitter",
    brake: "Exponential backoff with jitter; capped retry counts",
  },
  {
    t: "T+4m",
    tMin: 4,
    title: "Retry rate 5%, error rate still 0.1%",
    detail:
      "Retries are still succeeding — error rate stays flat. But downstream resolver is struggling. p99 latency starts climbing. THIS is the window to intervene.",
    severity: "warn",
    amplifier: "The amplifier is active but the error rate is hiding it",
    brake: "Alert on retry-rate spikes, not just error-rate spikes",
  },
  {
    t: "T+8m",
    tMin: 8,
    title: "p50 follows p99 up",
    detail:
      "Now most requests are slow. The slow resolver's connection pool is saturated; new lookups queue. The queueing is a second amplifier on top of the retry storm.",
    severity: "crit",
    amplifier: "Connection-pool exhaustion — queue grows faster than it drains",
    brake: "Bounded pools with fail-fast; bulkhead per downstream",
  },
  {
    t: "T+12m",
    tMin: 12,
    title: "Cascading to downstream services",
    detail:
      "Every service that does a DNS lookup on-hot-path is now slow. User-facing APIs return 5xx. Pagers fire across three teams.",
    severity: "crit",
    amplifier: "Shared-dependency cascade",
    brake: "Cache DNS at the service level; circuit-break unreachable deps",
  },
  {
    t: "T+18m",
    tMin: 18,
    title: "Responders reduce retry counts",
    detail:
      "Incident commander decides to shed load: push config to reduce client retries from 3× to 0×. Accepts higher error rate temporarily in exchange for breaking the amplifier.",
    severity: "warn",
    brake: "Load shedding — 'stop amplifying before you scale'",
  },
  {
    t: "T+25m",
    tMin: 25,
    title: "Resolver recovers",
    detail:
      "With retry load gone, the resolver catches up. Latency drops. But the downstream services are still recovering from queue backlog.",
    severity: "warn",
  },
  {
    t: "T+40m",
    tMin: 40,
    title: "Full recovery",
    detail:
      "Error rates normal. Retry counts can be restored. Incident commander posts 'resolved' in channel. Postmortem scheduled for tomorrow.",
    severity: "info",
  },
  {
    t: "T+24h",
    tMin: 1440,
    title: "Blameless postmortem published",
    detail:
      "Root cause: single resolver failure + no jitter on retries + no circuit breaker + alerts only on error rate, not retry rate. Action items: jittered backoff, circuit breakers, retry-rate alerts.",
    severity: "info",
    brake: "Structural fixes — the only way 'this won't happen again' becomes true",
  },
];

const SEV_COLORS = {
  info: "#7AE87A",
  warn: "#FFA832",
  crit: "#FF6B6B",
};

export default function CascadingTimeline({
  title,
  caption,
}: {
  title?: string;
  caption?: string;
}) {
  const [idx, setIdx] = useState(0);
  const m = MOMENTS[idx];

  return (
    <div
      style={{
        margin: "18px 0",
        padding: "16px 18px",
        background: "rgba(255,107,107,0.04)",
        border: "1px solid rgba(255,107,107,0.2)",
        borderRadius: 10,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "#FF6B6B",
          letterSpacing: "0.5px",
          marginBottom: 6,
          textTransform: "uppercase",
        }}
      >
        ⬟ Interactive — cascading failure timeline
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

      {/* horizontal axis of dots */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 4px",
          marginBottom: 10,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 4,
            right: 4,
            top: "50%",
            height: 2,
            background: "rgba(255,255,255,0.08)",
            zIndex: 0,
          }}
        />
        {MOMENTS.map((mom, i) => {
          const color = SEV_COLORS[mom.severity];
          const isActive = i === idx;
          return (
            <button
              key={i}
              onClick={() => setIdx(i)}
              title={`${mom.t} · ${mom.title}`}
              style={{
                position: "relative",
                zIndex: 1,
                width: isActive ? 18 : 12,
                height: isActive ? 18 : 12,
                borderRadius: "50%",
                background: isActive ? color : `${color}66`,
                border: `2px solid ${isActive ? "#FFF" : color}`,
                cursor: "pointer",
                padding: 0,
                transition: "all 0.2s",
                boxShadow: isActive ? `0 0 10px ${color}` : "none",
              }}
            />
          );
        })}
      </div>

      {/* time ticks */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 9,
          color: "#B8C4D8",
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: 14,
          padding: "0 2px",
        }}
      >
        {MOMENTS.map((mom, i) => (
          <span key={i} style={{ textAlign: "center", width: 32, marginLeft: -10 }}>
            {mom.t}
          </span>
        ))}
      </div>

      {/* controls */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <button
          onClick={() => setIdx(Math.max(0, idx - 1))}
          disabled={idx === 0}
          style={stepBtnStyle(idx === 0)}
        >
          ◀ prev
        </button>
        <button
          onClick={() => setIdx(Math.min(MOMENTS.length - 1, idx + 1))}
          disabled={idx === MOMENTS.length - 1}
          style={stepBtnStyle(idx === MOMENTS.length - 1)}
        >
          next ▶
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ color: "#B8C4D8", fontSize: 10, alignSelf: "center" }}>
          {idx + 1} / {MOMENTS.length}
        </div>
      </div>

      {/* active moment detail */}
      <div
        style={{
          padding: "12px 14px",
          background: "rgba(0,0,0,0.3)",
          borderLeft: `3px solid ${SEV_COLORS[m.severity]}`,
          borderRadius: 6,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <span
            style={{
              color: SEV_COLORS[m.severity],
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {m.t}
          </span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 10,
              fontSize: 9,
              fontWeight: 700,
              background: `${SEV_COLORS[m.severity]}22`,
              color: SEV_COLORS[m.severity],
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {m.severity}
          </span>
        </div>
        <div style={{ color: "#E8ECF0", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
          {m.title}
        </div>
        <div style={{ color: "#D0D4D8", fontSize: 11, lineHeight: 1.55, marginBottom: 8 }}>
          {m.detail}
        </div>
        {m.amplifier && (
          <div
            style={{
              fontSize: 10,
              padding: "5px 8px",
              background: "rgba(255,107,107,0.12)",
              borderRadius: 4,
              marginBottom: 4,
              color: "#FFB0B0",
            }}
          >
            <strong>Amplifier:</strong> {m.amplifier}
          </div>
        )}
        {m.brake && (
          <div
            style={{
              fontSize: 10,
              padding: "5px 8px",
              background: "rgba(122,232,122,0.12)",
              borderRadius: 4,
              color: "#9EE8AE",
            }}
          >
            <strong>Brake:</strong> {m.brake}
          </div>
        )}
      </div>
    </div>
  );
}

function stepBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: "5px 12px",
    fontSize: 10,
    fontWeight: 600,
    background: disabled ? "rgba(255,255,255,0.03)" : "rgba(255,107,107,0.15)",
    border: `1px solid ${disabled ? "rgba(255,255,255,0.08)" : "rgba(255,107,107,0.35)"}`,
    borderRadius: 4,
    color: disabled ? "var(--color-v2-text-muted)" : "#FFB0B0",
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
  };
}
