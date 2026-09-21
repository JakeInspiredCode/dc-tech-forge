"use client";

import { SECTIONS } from "@/lib/seeds/foundations-content";

interface FoundationsNavProps {
  activeSection: number;
  sidebarOpen: boolean;
  onGoTo: (id: number) => void;
}

export default function FoundationsNav({ activeSection, sidebarOpen, onGoTo }: FoundationsNavProps) {
  return (
    <div style={{
      width: sidebarOpen ? 280 : 0, flexShrink: 0, overflow: "hidden",
      background: "rgba(15,15,25,0.95)", borderRight: "1px solid rgba(255,255,255,0.06)",
      transition: "width 0.25s ease", zIndex: 50,
    }}>
      <div style={{ width: 280, padding: "16px 12px" }}>
        <div style={{ color: "var(--color-v2-text-muted)", fontSize: 12, fontWeight: 700, letterSpacing: "1px", padding: "8px 12px", marginBottom: 4 }}>
          SECTIONS
        </div>
        {SECTIONS.map((s) => (
          <button key={s.id} onClick={() => onGoTo(s.id)} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: "10px 12px", borderRadius: 8, border: "none", textAlign: "left",
            background: activeSection === s.id ? "rgba(80,200,255,0.1)" : "transparent",
            cursor: "pointer", transition: "all 0.15s",
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
              background: activeSection === s.id ? "rgba(80,200,255,0.2)" : "rgba(255,255,255,0.04)",
              color: activeSection === s.id ? "#50C8FF" : "var(--color-v2-text-muted)", fontSize: 13, fontWeight: 700,
              border: `1px solid ${activeSection === s.id ? "rgba(80,200,255,0.3)" : "rgba(255,255,255,0.06)"}`,
            }}>{s.id}</span>
            <span style={{
              color: activeSection === s.id ? "#E8ECF0" : "var(--color-v2-text-muted)", fontSize: 13, fontWeight: 500,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{s.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
