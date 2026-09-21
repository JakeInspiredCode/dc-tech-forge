"use client";

import { useState, useEffect } from "react";

interface Layer {
  id: string;
  name: string;
  role: string;
  accent: string;
  detail: string;
}

const LAYERS: Layer[] = [
  {
    id: "app",
    name: "Application",
    role: "curl / nginx / your service",
    accent: "#C58AFF",
    detail:
      "Writes to a socket FD. Doesn't see TCP, IP, or Ethernet — just bytes in, bytes out. `strace -e write` captures this layer.",
  },
  {
    id: "socket",
    name: "Socket / TCP",
    role: "Kernel net stack — TCP state machine",
    accent: "#50C8FF",
    detail:
      "SYN/ACK, window sizing, congestion control (bbr/cubic), retransmit timers. `ss -ti` exposes per-socket internals.",
  },
  {
    id: "ip",
    name: "IP",
    role: "Routing + fragmentation",
    accent: "#7AE87A",
    detail:
      "Routing table lookup (`ip route`), TTL decrement, fragmentation if egress MTU is smaller than the packet. `iptables`/`nftables` chains hook here.",
  },
  {
    id: "netfilter",
    name: "Netfilter",
    role: "Firewall + conntrack",
    accent: "#FFA832",
    detail:
      "INPUT / OUTPUT / FORWARD chains evaluate; conntrack entry created or matched; NAT rules apply in PREROUTING/POSTROUTING. Drop here = packet never reaches NIC.",
  },
  {
    id: "qdisc",
    name: "Qdisc",
    role: "Traffic control / queueing",
    accent: "#FF6B6B",
    detail:
      "Egress queueing discipline (`fq`, `pfifo_fast`, `fq_codel`). BBR requires `fq` for its pacing to actually pace. `tc qdisc show dev eth0`.",
  },
  {
    id: "nic",
    name: "NIC / Driver",
    role: "Ring buffer + DMA",
    accent: "#5AD0D0",
    detail:
      "Packet copied into TX ring buffer; NIC DMAs to the wire. `ethtool -g` shows ring size; `ethtool -S` shows per-queue counters (drops, errors, TX throughput).",
  },
  {
    id: "wire",
    name: "Wire",
    role: "Physical Ethernet",
    accent: "#B8C4D8",
    detail:
      "Bits on copper or fiber. Jumbo frames (MTU 9000) only work if every hop agrees; misconfigured MTU causes PMTUD failures that look like random slowdowns.",
  },
];

export default function PacketStack({
  title,
  caption,
}: {
  title?: string;
  caption?: string;
}) {
  const [expanded, setExpanded] = useState<string | null>("netfilter");
  const [travelPos, setTravelPos] = useState<number | null>(null);

  // Auto-animate packet descent when triggered
  useEffect(() => {
    if (travelPos === null) return;
    if (travelPos >= LAYERS.length - 1) {
      const t = setTimeout(() => setTravelPos(null), 1000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTravelPos(travelPos + 1), 350);
    return () => clearTimeout(t);
  }, [travelPos]);

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
        ⟴ Interactive — packet through the Linux stack
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

      <button
        onClick={() => setTravelPos(0)}
        disabled={travelPos !== null}
        style={{
          padding: "6px 14px",
          fontSize: 10,
          fontWeight: 700,
          background: travelPos !== null ? "rgba(80,200,255,0.15)" : "#50C8FF",
          color: travelPos !== null ? "var(--color-v2-text-muted)" : "#1A1A2E",
          border: "none",
          borderRadius: 6,
          cursor: travelPos !== null ? "not-allowed" : "pointer",
          marginBottom: 10,
          fontFamily: "inherit",
        }}
      >
        {travelPos !== null ? "sending…" : "▸ Send a packet"}
      </button>

      <div style={{ display: "grid", gap: 4 }}>
        {LAYERS.map((layer, i) => {
          const isExpanded = expanded === layer.id;
          const isTravelingHere = travelPos === i;
          const hasTraveled = travelPos !== null && travelPos > i;
          return (
            <div
              key={layer.id}
              onClick={() => setExpanded(isExpanded ? null : layer.id)}
              style={{
                padding: "10px 12px",
                background: isTravelingHere
                  ? `${layer.accent}33`
                  : hasTraveled
                  ? `${layer.accent}11`
                  : "rgba(255,255,255,0.02)",
                border: `1px solid ${isTravelingHere ? layer.accent : `${layer.accent}44`}`,
                borderLeft: `3px solid ${layer.accent}`,
                borderRadius: 6,
                cursor: "pointer",
                transition: "all 0.25s",
                transform: isTravelingHere ? "translateX(6px)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: layer.accent,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {layer.name}
                  </div>
                  <div style={{ color: "#C0C4C8", fontSize: 10, marginTop: 2 }}>
                    {layer.role}
                  </div>
                </div>
                <span
                  style={{
                    color: "var(--color-v2-text-muted)",
                    fontSize: 10,
                    transition: "transform 0.2s",
                    transform: isExpanded ? "rotate(90deg)" : "none",
                  }}
                >
                  ▸
                </span>
              </div>
              {isExpanded && (
                <div
                  style={{
                    marginTop: 8,
                    padding: "8px 10px",
                    background: "rgba(0,0,0,0.25)",
                    borderRadius: 4,
                    color: "#D0D4D8",
                    fontSize: 10,
                    lineHeight: 1.55,
                  }}
                >
                  {layer.detail}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
