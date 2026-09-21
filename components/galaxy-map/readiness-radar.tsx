"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TOPICS } from "@/lib/types";
import { V2 } from "@/lib/design/forge-v2-tokens";

interface ReadinessRadarProps {
  progress: { topicId: string; masteryPercent: number }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  linux: "#06d6d6",
  hardware: "#f0a830",
  networking: "#3b82f6",
  fiber: "#ec4899",
  "power-cooling": "#f97316",
  "ops-processes": "#22c55e",
  scale: "#a855f7",
  behavioral: V2.text.muted,
};

const SHORT_LABELS: Record<string, string> = {
  linux: "LINUX",
  hardware: "HW",
  networking: "NET",
  fiber: "FIBER",
  "power-cooling": "POWER",
  "ops-processes": "OPS",
  scale: "SCALE",
  behavioral: "BEHAV",
};

function hexToRgb(hex: string) {
  return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`;
}

export default function ReadinessRadar({ progress }: ReadinessRadarProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build readiness from real progress data
  const categories = TOPICS.map((t) => {
    const p = progress.find((pr) => pr.topicId === t.id);
    return {
      id: t.id,
      label: t.name,
      short: SHORT_LABELS[t.id] ?? t.id.toUpperCase(),
      color: CATEGORY_COLORS[t.id] ?? "#06d6d6",
      readiness: (p?.masteryPercent ?? 0) / 100,
    };
  });

  const overallReadiness = categories.reduce((s, c) => s + c.readiness, 0) / categories.length;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctxRaw = canvas.getContext("2d");
    if (!ctxRaw) return;
    const ctx = ctxRaw;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (Math.min(w, h) < 80) {
      canvas.width = 0;
      canvas.height = 0;
      return;
    }

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.scale(dpr, dpr);

    const cx = w / 2;
    const cy = h * 0.47; // shift up slightly — bottom labels need more room
    // Radar radius based on the smaller dimension, leaving room for labels
    const minDim = Math.min(w, h);
    const maxR = minDim * 0.38;
    const n = categories.length;
    const angleStep = (Math.PI * 2) / n;

    function vertexPos(i: number, fraction: number) {
      const a = i * angleStep - Math.PI / 2;
      const r = maxR * fraction;
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
    }

    function drawSmoothCurve(points: { x: number; y: number }[], tension = 0.35) {
      if (points.length < 3) return;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length; i++) {
        const prev = points[(i - 1 + points.length) % points.length];
        const curr = points[i];
        const next = points[(i + 1) % points.length];
        const next2 = points[(i + 2) % points.length];
        const cp1x = curr.x + (next.x - prev.x) * tension;
        const cp1y = curr.y + (next.y - prev.y) * tension;
        const cp2x = next.x - (next2.x - curr.x) * tension;
        const cp2y = next.y - (next2.y - curr.y) * tension;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, next.x, next.y);
      }
      ctx.closePath();
    }

    ctx.clearRect(0, 0, w, h);

    // ── Background ambient glow ──
    const ambient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR + 30);
    ambient.addColorStop(0, "rgba(6,214,214,0.012)");
    ambient.addColorStop(0.5, "rgba(6,214,214,0.004)");
    ambient.addColorStop(1, "transparent");
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, w, h);

    // ── Inner web rings ──
    [0.2, 0.4, 0.6, 0.8].forEach((pct, ri) => {
      const ringPts = [];
      for (let i = 0; i < n; i++) {
        const a = i * angleStep - Math.PI / 2;
        ringPts.push({ x: cx + Math.cos(a) * maxR * pct, y: cy + Math.sin(a) * maxR * pct });
      }
      drawSmoothCurve(ringPts, 0.3);
      ctx.strokeStyle = `rgba(6,214,214,${0.02 + ri * 0.006})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    // ── Max potential outline ──
    const maxPts = categories.map((_, i) => vertexPos(i, 1.0));
    drawSmoothCurve(maxPts, 0.3);
    ctx.strokeStyle = "rgba(6,214,214,0.06)";
    ctx.lineWidth = 1;
    ctx.stroke();
    drawSmoothCurve(maxPts, 0.3);
    ctx.fillStyle = "rgba(6,214,214,0.008)";
    ctx.fill();

    // ── Axis lines ──
    categories.forEach((cat, i) => {
      const a = i * angleStep - Math.PI / 2;
      const grad = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.3, `rgba(${hexToRgb(cat.color)},0.03)`);
      grad.addColorStop(0.7, `rgba(${hexToRgb(cat.color)},0.05)`);
      grad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * (maxR + 3), cy + Math.sin(a) * (maxR + 3));
      ctx.strokeStyle = grad;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

    // ── Readiness fill ──
    const mainPts = categories.map((cat, i) => vertexPos(i, Math.max(cat.readiness, 0.05)));

    // Outer glow
    const glowPts = categories.map((cat, i) => vertexPos(i, Math.max(cat.readiness, 0.05) * 1.12));
    drawSmoothCurve(glowPts, 0.4);
    const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.7);
    glowGrad.addColorStop(0, "rgba(20,40,80,0.03)");
    glowGrad.addColorStop(0.5, "rgba(10,60,100,0.025)");
    glowGrad.addColorStop(1, "rgba(6,214,214,0.015)");
    ctx.fillStyle = glowGrad;
    ctx.fill();

    // Main fill
    drawSmoothCurve(mainPts, 0.35);
    const mainGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.6);
    mainGrad.addColorStop(0, "rgba(15,30,70,0.05)");
    mainGrad.addColorStop(0.3, "rgba(10,50,100,0.06)");
    mainGrad.addColorStop(0.6, "rgba(6,140,180,0.07)");
    mainGrad.addColorStop(1, "rgba(6,214,214,0.1)");
    ctx.fillStyle = mainGrad;
    ctx.fill();

    // Edge line
    drawSmoothCurve(mainPts, 0.35);
    ctx.strokeStyle = "rgba(6,214,214,0.22)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Soft edge echo
    drawSmoothCurve(mainPts, 0.35);
    ctx.strokeStyle = "rgba(6,214,214,0.04)";
    ctx.lineWidth = 4;
    ctx.stroke();

    // ── Per-category color washes ──
    categories.forEach((cat, i) => {
      const p = mainPts[i];
      const rgb = hexToRgb(cat.color);
      const isHov = hovered === i;
      const glowSize = isHov ? maxR * 0.22 : maxR * 0.14;
      const colorGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
      colorGlow.addColorStop(0, `rgba(${rgb},${isHov ? 0.12 : 0.05})`);
      colorGlow.addColorStop(1, "transparent");
      ctx.fillStyle = colorGlow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
      ctx.fill();
    });

    // ── Vertex nodes + labels ──
    const labelFontSize = Math.max(7, minDim * 0.028);
    const pctFontSize = Math.max(8, minDim * 0.032);

    categories.forEach((cat, i) => {
      const p = mainPts[i];
      const rgb = hexToRgb(cat.color);
      const isHov = hovered === i;

      // Halo
      const haloR = isHov ? maxR * 0.08 : maxR * 0.045;
      const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloR);
      halo.addColorStop(0, `rgba(${rgb},${isHov ? 0.35 : 0.15})`);
      halo.addColorStop(0.5, `rgba(${rgb},${isHov ? 0.12 : 0.05})`);
      halo.addColorStop(1, "transparent");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      const dotR = isHov ? maxR * 0.02 : maxR * 0.014;
      ctx.beginPath();
      ctx.arc(p.x, p.y, dotR, 0, Math.PI * 2);
      ctx.fillStyle = cat.color;
      ctx.globalAlpha = isHov ? 1 : 0.75;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Hover ring
      if (isHov) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, maxR * 0.04, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb},0.25)`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Labels
      const a = i * angleStep - Math.PI / 2;
      const labelR = maxR + minDim * 0.055;
      const lx = cx + Math.cos(a) * labelR;
      const ly = cy + Math.sin(a) * labelR;

      // Category dot
      ctx.beginPath();
      ctx.arc(lx - minDim * 0.05, ly - labelFontSize * 0.4, minDim * 0.006, 0, Math.PI * 2);
      ctx.fillStyle = cat.color;
      ctx.globalAlpha = isHov ? 0.9 : 0.45;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Category name
      ctx.font = `${isHov ? 500 : 400} ${labelFontSize}px 'IBM Plex Sans', sans-serif`;
      ctx.fillStyle = isHov ? cat.color : V2.text.muted;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cat.short, lx, ly - labelFontSize * 0.4);

      // Percentage
      ctx.font = `${isHov ? 600 : 500} ${pctFontSize}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = isHov ? "#e0e4ec" : V2.text.muted;
      ctx.fillText(`${Math.round(cat.readiness * 100)}%`, lx, ly + pctFontSize * 0.6);

      // Connector line
      const lineEnd = maxR + minDim * 0.03;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (maxR * Math.max(cat.readiness, 0.05) + 4), cy + Math.sin(a) * (maxR * Math.max(cat.readiness, 0.05) + 4));
      ctx.lineTo(cx + Math.cos(a) * lineEnd, cy + Math.sin(a) * lineEnd);
      ctx.strokeStyle = `rgba(${rgb},${isHov ? 0.15 : 0.04})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    // ── Center circles ──
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * 0.07, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(6,214,214,0.05)";
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, maxR * 0.045, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(6,214,214,0.08)";
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, maxR * 0.025, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(6,214,214,0.04)";
    ctx.fill();
    ctx.strokeStyle = "rgba(6,214,214,0.1)";
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, maxR * 0.01, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(6,214,214,0.2)";
    ctx.fill();
  }, [categories, hovered]);

  // Draw on mount and when hovered/data changes
  useEffect(() => {
    draw();
  }, [draw]);

  // Redraw on resize
  useEffect(() => {
    const observer = new ResizeObserver(() => draw());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [draw]);

  const handleMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cxHover = rect.width / 2;
    const cyHover = rect.height * 0.47;
    const x = e.clientX - rect.left - cxHover;
    const y = e.clientY - rect.top - cyHover;
    const dist = Math.sqrt(x * x + y * y);
    const maxR = Math.min(rect.width, rect.height) * 0.38;
    if (dist > maxR * 1.3) { setHovered(null); return; }
    const a = (Math.atan2(y, x) + Math.PI * 2.5) % (Math.PI * 2);
    const step = (Math.PI * 2) / categories.length;
    const idx = Math.floor((a + step / 2) % (Math.PI * 2) / step);
    setHovered(idx >= 0 && idx < categories.length ? idx : null);
  }, [categories.length]);

  return (
    <div className="flex flex-col items-center h-full">
      {/* Header */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[10px] telemetry-font tracking-[0.18em] text-v2-cyan/80 uppercase">
          Readiness
        </span>
        <span
          className="text-sm telemetry-font font-semibold text-v2-text"
          style={{ textShadow: "0 0 12px rgba(6,214,214,0.1)" }}
        >
          {Math.round(overallReadiness * 100)}%
        </span>
      </div>

      {/* Canvas container — fills remaining space */}
      <div ref={containerRef} className="flex-1 w-full flex items-center justify-center min-h-0">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMove}
          onMouseLeave={() => setHovered(null)}
          className="cursor-default"
        />
      </div>
    </div>
  );
}
