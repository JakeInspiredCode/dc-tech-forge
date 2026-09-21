"use client";

import { useState } from "react";

const VG_TOTAL_GB = 2000;
const PV_SIZES_GB = [1000, 1000];

export default function LvmStack({
  title,
  caption,
}: {
  title?: string;
  caption?: string;
}) {
  const [lvSize, setLvSize] = useState(500);
  const [step, setStep] = useState(0);

  const pvBarTotal = PV_SIZES_GB.reduce((a, b) => a + b, 0);
  const used = lvSize;
  const free = VG_TOTAL_GB - used;
  const usedPct = Math.round((used / VG_TOTAL_GB) * 100);

  const steps = [
    { label: "1. Physical Volumes (PV)", color: "#50C8FF" },
    { label: "2. Volume Group (VG)", color: "#FFA832" },
    { label: "3. Logical Volume (LV)", color: "#7AE87A" },
  ];

  return (
    <div
      style={{
        margin: "18px 0",
        padding: "16px 18px",
        background: "rgba(122,232,122,0.04)",
        border: "1px solid rgba(122,232,122,0.18)",
        borderRadius: 10,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "#7AE87A",
          letterSpacing: "0.5px",
          marginBottom: 6,
          textTransform: "uppercase",
        }}
      >
        ▣ Interactive — LVM stack
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

      {/* step selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            style={{
              padding: "5px 10px",
              fontSize: 10,
              fontWeight: 600,
              background: step >= i ? `${s.color}22` : "rgba(255,255,255,0.03)",
              border: `1px solid ${step === i ? s.color : `${s.color}44`}`,
              borderRadius: 4,
              color: step >= i ? s.color : "#B8C4D8",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* stack diagram */}
      <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
        {/* LV (top) */}
        <div style={{ opacity: step >= 2 ? 1 : 0.25, transition: "opacity 0.3s" }}>
          <LayerLabel text="/dev/datavg/datalv — filesystem: XFS" color="#7AE87A" />
          <div
            style={{
              height: 32,
              border: "1px solid #7AE87A",
              borderRadius: 4,
              background: "rgba(122,232,122,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9EE8AE",
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
            }}
          >
            LV · {lvSize} GB
          </div>
        </div>

        {/* VG (middle) */}
        <div style={{ opacity: step >= 1 ? 1 : 0.25, transition: "opacity 0.3s" }}>
          <LayerLabel text={`datavg — ${used} GB used of ${VG_TOTAL_GB} GB (${usedPct}% allocated, ${free} GB free)`} color="#FFA832" />
          <div
            style={{
              display: "flex",
              height: 28,
              border: "1px solid #FFA832",
              borderRadius: 4,
              overflow: "hidden",
              background: "rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                width: `${usedPct}%`,
                background: "rgba(122,232,122,0.35)",
                transition: "width 0.3s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9EE8AE",
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              allocated to LV
            </div>
            <div
              style={{
                flex: 1,
                background: "rgba(255,170,50,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFC878",
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              free ({free} GB)
            </div>
          </div>
        </div>

        {/* PVs (bottom) */}
        <div style={{ opacity: step >= 0 ? 1 : 0.25, transition: "opacity 0.3s" }}>
          <LayerLabel
            text={`${PV_SIZES_GB.length} Physical Volumes — total ${pvBarTotal} GB`}
            color="#50C8FF"
          />
          <div style={{ display: "flex", gap: 6 }}>
            {PV_SIZES_GB.map((sz, i) => (
              <div
                key={i}
                style={{
                  flex: sz,
                  height: 26,
                  border: "1px solid #50C8FF",
                  borderRadius: 4,
                  background: "rgba(80,200,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9CD8FF",
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                }}
              >
                /dev/sd{String.fromCharCode(98 + i)} · {sz} GB
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* slider */}
      {step >= 2 && (
        <div
          style={{
            padding: "10px 12px",
            background: "rgba(0,0,0,0.25)",
            borderRadius: 6,
            border: "1px solid rgba(122,232,122,0.2)",
          }}
        >
          <div style={{ fontSize: 10, color: "#9EE8AE", marginBottom: 6, fontWeight: 600 }}>
            Drag to resize the LV (lvextend / lvreduce)
          </div>
          <input aria-label="Logical volume size in GB"
            type="range"
            min={100}
            max={VG_TOTAL_GB}
            step={50}
            value={lvSize}
            onChange={(e) => setLvSize(Number(e.target.value))}
            style={{
              width: "100%",
              accentColor: "#7AE87A",
            }}
          />
          <div
            style={{
              marginTop: 6,
              fontFamily: "'JetBrains Mono', monospace",
              color: "#C8CCD0",
              fontSize: 10,
            }}
          >
            sudo lvextend -r -L {lvSize}G /dev/datavg/datalv
          </div>
        </div>
      )}
    </div>
  );
}

function LayerLabel({ text, color }: { text: string; color: string }) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        color,
        letterSpacing: "0.5px",
        marginBottom: 4,
        textTransform: "uppercase",
      }}
    >
      {text}
    </div>
  );
}
