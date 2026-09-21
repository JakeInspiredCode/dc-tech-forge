"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { V2 } from "@/lib/design/forge-v2-tokens";

// ── Types ──

export interface RadarCategory {
  id: string;
  label: string;
  color: string;
  total: number;
  done: number;
  /** Individual item completion flags (up to DOT_LIMIT rendered as dots) */
  items: { id: string; done: boolean }[];
}

interface RadarCanvasProps {
  categories: RadarCategory[];
  activeIdx: number;
  onSelectSector: (idx: number) => void;
  hoveredSector: number | null;
  onHoverSector: (idx: number | null) => void;
  /** Total resolved count shown in center hub */
  totalDone: number;
  totalItems: number;
}

const DOT_LIMIT = 10;

function hexToRgb(hex: string): string {
  return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`;
}

function seedDebris(id: string) {
  const h = Array.from(id).reduce((s, c) => s + c.charCodeAt(0), 0);
  const rng = (s: number) => { s = Math.sin(s) * 43758.5453; return s - Math.floor(s); };
  return Array.from({ length: 5 }, (_, i) => ({
    angle: rng(h * 100 + i * 7) * Math.PI * 2,
    dist: 3 + rng(h * 200 + i * 13) * 6,
    size: 0.3 + rng(h * 300 + i * 17) * 0.8,
    opacity: 0.15 + rng(h * 400 + i * 23) * 0.25,
  }));
}

function hashStr(s: string): number {
  return Array.from(s).reduce((h, c) => h + c.charCodeAt(0), 0);
}

export default function RadarCanvas({
  categories, activeIdx, onSelectSector, hoveredSector, onHoverSector, totalDone, totalItems,
}: RadarCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sweepRef = useRef(0);
  const frameRef = useRef(0);
  const flashTimesRef = useRef<Record<string, number>>({});
  const [canvasSize, setCanvasSize] = useState(380);

  // Observe container size and pick the smaller dimension
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setCanvasSize(Math.max(160, Math.floor(Math.min(width, height))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = canvasSize;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    ctx.scale(dpr, dpr);

    // Scale factor relative to reference size of 380
    const S = size / 380;
    const cx = size / 2;
    const cy = size / 2;
    // Labels are inside the radar now, so maxR can use more of the canvas
    const maxR = Math.min(155 * S, size / 2 - 8 * S);
    const hubR = 28 * S;
    const sectorAngle = (Math.PI * 2) / categories.length;

    // Pre-compute dot positions
    const dotPositions: Record<string, { x: number; y: number; angle: number; r: number }> = {};
    categories.forEach((cat, ci) => {
      const startAngle = ci * sectorAngle - Math.PI / 2;
      const showable = cat.items.slice(0, DOT_LIMIT);
      showable.forEach((item, j) => {
        const a = startAngle + 0.08 + (j / Math.max(showable.length - 1, 1)) * (sectorAngle - 0.16);
        const band = j % 3;
        const r = Math.min((42 + band * 16 + j * 5.5) * S, maxR - 12 * S);
        dotPositions[item.id] = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, angle: a, r };
      });
    });

    function draw(t: number) {
      ctx!.clearRect(0, 0, size, size);
      sweepRef.current = (t * 0.00025) % (Math.PI * 2);
      const sweep = sweepRef.current;

      // BG glow
      const bgGlow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, maxR + 40 * S);
      bgGlow.addColorStop(0, "rgba(6,214,214,0.012)");
      bgGlow.addColorStop(1, "transparent");
      ctx!.fillStyle = bgGlow;
      ctx!.fillRect(0, 0, size, size);

      // Concentric rings + ticks
      const rings = [35, 60, 85, 110, 135, 155].map((r) => r * S);
      rings.forEach((r, ri) => {
        ctx!.beginPath();
        ctx!.arc(cx, cy, r, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(6,214,214,${0.03 + ri * 0.008})`;
        ctx!.lineWidth = 0.5;
        ctx!.stroke();
        if (ri > 0) {
          for (let ti = 0; ti < 72; ti++) {
            const a = (ti * 5) * Math.PI / 180;
            const major = ti % 12 === 0;
            const mid = ti % 6 === 0;
            const len = (major ? 5 : mid ? 3 : 1.5) * S;
            ctx!.beginPath();
            ctx!.moveTo(cx + Math.cos(a) * (r - len), cy + Math.sin(a) * (r - len));
            ctx!.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
            ctx!.strokeStyle = `rgba(6,214,214,${major ? 0.07 : mid ? 0.04 : 0.02})`;
            ctx!.lineWidth = major ? 0.8 : 0.4;
            ctx!.stroke();
          }
        }
      });

      // Sector dividers
      categories.forEach((_, i) => {
        const a = i * sectorAngle - Math.PI / 2;
        ctx!.beginPath();
        ctx!.moveTo(cx + Math.cos(a) * hubR, cy + Math.sin(a) * hubR);
        ctx!.lineTo(cx + Math.cos(a) * (maxR + 6 * S), cy + Math.sin(a) * (maxR + 6 * S));
        ctx!.strokeStyle = "rgba(6,214,214,0.05)";
        ctx!.lineWidth = 0.5;
        ctx!.stroke();
      });

      // Sectors
      categories.forEach((cat, ci) => {
        const startA = ci * sectorAngle - Math.PI / 2;
        const endA = startA + sectorAngle;
        const pct = cat.done / cat.total;
        const isActive = ci === activeIdx;
        const isHov = ci === hoveredSector;
        const rgb = hexToRgb(cat.color);
        const showableDots = cat.items.slice(0, DOT_LIMIT);
        const overflowCount = Math.max(cat.items.length - DOT_LIMIT, 0);
        const overflowUndone = cat.items.slice(DOT_LIMIT).filter((x) => !x.done).length;

        // Completion fill arc
        if (pct > 0) {
          const fillR = 30 * S + pct * (maxR - 30 * S);
          ctx!.beginPath(); ctx!.moveTo(cx, cy);
          ctx!.arc(cx, cy, fillR, startA + 0.02, endA - 0.02); ctx!.closePath();
          const grad = ctx!.createRadialGradient(cx, cy, 20 * S, cx, cy, fillR);
          grad.addColorStop(0, `rgba(${rgb},${isActive ? 0.04 : 0.015})`);
          grad.addColorStop(0.6, `rgba(${rgb},${isActive ? 0.09 : 0.035})`);
          grad.addColorStop(1, `rgba(${rgb},${isActive ? 0.06 : 0.02})`);
          ctx!.fillStyle = grad; ctx!.fill();
          ctx!.beginPath(); ctx!.arc(cx, cy, fillR, startA + 0.03, endA - 0.03);
          ctx!.strokeStyle = `rgba(${rgb},${isActive ? 0.4 : 0.15})`;
          ctx!.lineWidth = isActive ? 1.2 : 0.6; ctx!.stroke();
        }

        // Active outline + brackets
        if (isActive || isHov) {
          ctx!.beginPath(); ctx!.arc(cx, cy, maxR, startA + 0.01, endA - 0.01);
          ctx!.strokeStyle = `rgba(${rgb},${isActive ? 0.3 : 0.15})`;
          ctx!.lineWidth = isActive ? 1.8 : 1; ctx!.stroke();
          [startA + 0.02, endA - 0.02].forEach((a) => {
            ctx!.beginPath();
            ctx!.moveTo(cx + Math.cos(a) * (maxR - 10 * S), cy + Math.sin(a) * (maxR - 10 * S));
            ctx!.lineTo(cx + Math.cos(a) * (maxR + 2 * S), cy + Math.sin(a) * (maxR + 2 * S));
            ctx!.strokeStyle = `rgba(${rgb},${isActive ? 0.45 : 0.25})`; ctx!.lineWidth = 1; ctx!.stroke();
          });
        }

        // Threat density horizon
        if (overflowCount > 0 && overflowUndone > 0) {
          const hInner = maxR - 18 * S, hOuter = maxR - 3 * S;
          const intensity = Math.min(overflowUndone / 15, 1);
          const pulse = Math.sin(t * 0.003 + ci) * 0.15 + 0.85;
          ctx!.beginPath();
          ctx!.arc(cx, cy, hOuter, startA + 0.04, endA - 0.04);
          ctx!.arc(cx, cy, hInner, endA - 0.04, startA + 0.04, true); ctx!.closePath();
          const hGrad = ctx!.createRadialGradient(cx, cy, hInner, cx, cy, hOuter);
          hGrad.addColorStop(0, "transparent");
          hGrad.addColorStop(0.3, `rgba(${rgb},${0.03 * intensity * pulse})`);
          hGrad.addColorStop(0.7, `rgba(${rgb},${0.08 * intensity * pulse})`);
          hGrad.addColorStop(1, `rgba(${rgb},${0.04 * intensity * pulse})`);
          ctx!.fillStyle = hGrad; ctx!.fill();

          const hashCount = Math.min(overflowUndone, 20);
          for (let h = 0; h < hashCount; h++) {
            const ha = startA + 0.06 + (h / hashCount) * (sectorAngle - 0.12);
            const hR = hInner + 2 * S + (h % 3) * 4 * S;
            ctx!.beginPath();
            ctx!.moveTo(cx + Math.cos(ha) * hR, cy + Math.sin(ha) * hR);
            ctx!.lineTo(cx + Math.cos(ha) * (hR + (3 + intensity * 4) * S), cy + Math.sin(ha) * (hR + (3 + intensity * 4) * S));
            ctx!.strokeStyle = `rgba(${rgb},${(0.1 + intensity * 0.2) * pulse})`; ctx!.lineWidth = 0.8; ctx!.stroke();
          }

          const midA = (startA + endA) / 2, badgeR = maxR - 10 * S;
          const bx = cx + Math.cos(midA) * badgeR, by = cy + Math.sin(midA) * badgeR;
          ctx!.beginPath(); ctx!.arc(bx, by, 8 * S, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${rgb},${0.12 * pulse})`; ctx!.fill();
          ctx!.strokeStyle = `rgba(${rgb},${0.3 * pulse})`; ctx!.lineWidth = 0.5; ctx!.stroke();
          ctx!.font = `600 ${6 * S}px 'JetBrains Mono', monospace`;
          ctx!.fillStyle = `rgba(${rgb},${0.7 * pulse})`;
          ctx!.textAlign = "center"; ctx!.textBaseline = "middle"; ctx!.fillText(`+${overflowUndone}`, bx, by);
        }

        // Individual dots
        showableDots.forEach((item) => {
          const pos = dotPositions[item.id]; if (!pos) return;
          const { x: ix, y: iy, angle: dotAngle } = pos;
          const nd = ((dotAngle + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          const ns = (sweep % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          const wd = ((ns - nd) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          if (wd < 0.06) flashTimesRef.current[item.id] = t;
          const tsf = t - (flashTimesRef.current[item.id] || 0);
          const fi = Math.max(0, 1 - tsf / 1200);

          if (item.done) {
            ctx!.beginPath(); ctx!.arc(ix, iy, 5 * S, 0, Math.PI * 2);
            ctx!.strokeStyle = `rgba(${rgb},${0.06 + fi * 0.08})`; ctx!.lineWidth = 0.4;
            ctx!.setLineDash([1.5 * S, 2 * S]); ctx!.stroke(); ctx!.setLineDash([]);
            seedDebris(item.id).forEach((d) => {
              ctx!.beginPath(); ctx!.arc(ix + Math.cos(d.angle) * d.dist * S, iy + Math.sin(d.angle) * d.dist * S, d.size * S, 0, Math.PI * 2);
              ctx!.fillStyle = `rgba(${rgb},${d.opacity * (0.5 + fi * 0.5)})`; ctx!.fill();
            });
            ctx!.beginPath(); ctx!.arc(ix, iy, 1.2 * S, 0, Math.PI * 2);
            ctx!.fillStyle = `rgba(${rgb},${0.12 + fi * 0.15})`; ctx!.fill();
            if (fi > 0.1) {
              const bg = ctx!.createRadialGradient(ix, iy, 0, ix, iy, 10 * S);
              bg.addColorStop(0, `rgba(${rgb},${0.08 * fi})`); bg.addColorStop(1, "transparent");
              ctx!.fillStyle = bg; ctx!.beginPath(); ctx!.arc(ix, iy, 10 * S, 0, Math.PI * 2); ctx!.fill();
            }
          } else {
            const glR = (8 + fi * 6) * S;
            const dg = ctx!.createRadialGradient(ix, iy, 0, ix, iy, glR);
            dg.addColorStop(0, `rgba(${rgb},${(isActive ? 0.12 : 0.04) + fi * 0.15})`); dg.addColorStop(1, "transparent");
            ctx!.fillStyle = dg; ctx!.beginPath(); ctx!.arc(ix, iy, glR, 0, Math.PI * 2); ctx!.fill();
            const rp = Math.sin(t * 0.004 + hashStr(item.id)) * 0.08 + 0.92;
            ctx!.beginPath(); ctx!.arc(ix, iy, 4 * S * rp, 0, Math.PI * 2);
            ctx!.strokeStyle = `rgba(${rgb},${(isActive ? 0.25 : 0.1) + fi * 0.3})`; ctx!.lineWidth = 0.6; ctx!.stroke();
            const cs = (2 + fi * 1.5) * S;
            ctx!.beginPath(); ctx!.arc(ix, iy, cs, 0, Math.PI * 2);
            ctx!.fillStyle = `rgba(${rgb},${(isActive ? 0.7 : 0.3) + fi * 0.3})`; ctx!.fill();
            if (fi > 0.5) { ctx!.beginPath(); ctx!.arc(ix, iy, 1 * S, 0, Math.PI * 2); ctx!.fillStyle = `rgba(255,255,255,${fi * 0.4})`; ctx!.fill(); }
          }
        });

        // Labels — all inside the radar, placed in the outer band of each sector
        // Use a radius that keeps text well inside the ring and away from density badges
        const midA = (startA + endA) / 2;
        const cosM = Math.cos(midA);
        const sinM = Math.sin(midA);
        const labelR = maxR * 0.72;
        const lx = cx + cosM * labelR;
        const ly = cy + sinM * labelR;
        // Align text toward the center so it doesn't overshoot the sector
        const align: CanvasTextAlign = "center";
        const fontSize = Math.max(6, 7 * S);
        ctx!.font = `${isActive ? 600 : 400} ${fontSize}px 'JetBrains Mono', monospace`;
        ctx!.fillStyle = isActive ? cat.color : isHov ? "#8eafc8" : V2.text.muted;
        ctx!.textAlign = align; ctx!.textBaseline = "middle";
        ctx!.fillText(cat.label, lx, ly - 4 * S);
        ctx!.font = `400 ${Math.max(5, 6 * S)}px 'JetBrains Mono', monospace`;
        ctx!.fillStyle = isActive ? "#8eafc8" : V2.text.muted;
        ctx!.fillText(`${cat.done}/${cat.total}`, lx, ly + 6 * S);
      });

      // Sweep line + trail
      const swa = sweep - Math.PI / 2;
      for (let i = 0; i < 40; i++) {
        const ta = swa - i * 0.012;
        ctx!.beginPath(); ctx!.moveTo(cx + Math.cos(ta) * hubR, cy + Math.sin(ta) * hubR);
        ctx!.lineTo(cx + Math.cos(ta) * maxR, cy + Math.sin(ta) * maxR);
        ctx!.strokeStyle = `rgba(6,214,214,${(1 - i / 40) * 0.035})`; ctx!.lineWidth = 1; ctx!.stroke();
      }
      ctx!.beginPath(); ctx!.moveTo(cx + Math.cos(swa) * hubR, cy + Math.sin(swa) * hubR);
      ctx!.lineTo(cx + Math.cos(swa) * maxR, cy + Math.sin(swa) * maxR);
      ctx!.strokeStyle = "rgba(6,214,214,0.2)"; ctx!.lineWidth = 1.5; ctx!.stroke();
      ctx!.beginPath(); ctx!.arc(cx + Math.cos(swa) * maxR, cy + Math.sin(swa) * maxR, 2.5 * S, 0, Math.PI * 2);
      ctx!.fillStyle = "rgba(6,214,214,0.45)"; ctx!.fill();

      // Center hub
      ctx!.beginPath(); ctx!.arc(cx, cy, hubR, 0, Math.PI * 2); ctx!.fillStyle = "#050810"; ctx!.fill();
      ctx!.strokeStyle = "rgba(6,214,214,0.12)"; ctx!.lineWidth = 1.2; ctx!.stroke();
      ctx!.beginPath(); ctx!.arc(cx, cy, 23 * S, 0, Math.PI * 2);
      ctx!.strokeStyle = "rgba(6,214,214,0.06)"; ctx!.lineWidth = 0.5; ctx!.stroke();
      const cGlow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, 22 * S);
      cGlow.addColorStop(0, "rgba(6,214,214,0.05)"); cGlow.addColorStop(1, "transparent");
      ctx!.fillStyle = cGlow; ctx!.beginPath(); ctx!.arc(cx, cy, 22 * S, 0, Math.PI * 2); ctx!.fill();
      for (let i = 0; i < 8; i++) {
        const a = (i * 45) * Math.PI / 180;
        ctx!.beginPath(); ctx!.moveTo(cx + Math.cos(a) * 24 * S, cy + Math.sin(a) * 24 * S);
        ctx!.lineTo(cx + Math.cos(a) * hubR, cy + Math.sin(a) * hubR);
        ctx!.strokeStyle = "rgba(6,214,214,0.1)"; ctx!.lineWidth = 0.8; ctx!.stroke();
      }
      ctx!.font = `600 ${Math.max(10, 17 * S)}px 'JetBrains Mono', monospace`;
      ctx!.fillStyle = "#e0e4ec"; ctx!.textAlign = "center"; ctx!.textBaseline = "middle";
      ctx!.fillText(String(totalDone), cx, cy - 3 * S);
      ctx!.font = `400 ${Math.max(4, 5.5 * S)}px 'JetBrains Mono', monospace`;
      ctx!.fillStyle = V2.text.muted; ctx!.fillText(`OF ${totalItems}`, cx, cy + 10 * S);
      ctx!.beginPath(); ctx!.arc(cx, cy, maxR + 5 * S, 0, Math.PI * 2);
      ctx!.strokeStyle = "rgba(6,214,214,0.03)"; ctx!.lineWidth = 0.5;
      ctx!.setLineDash([2, 5]); ctx!.stroke(); ctx!.setLineDash([]);

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [activeIdx, hoveredSector, categories, totalDone, totalItems, canvasSize]);

  const toLocal = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const half = canvasSize / 2;
      return { x: e.clientX - rect.left - half, y: e.clientY - rect.top - half };
    },
    [canvasSize],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = toLocal(e);
      const a = (Math.atan2(y, x) + Math.PI * 2.5) % (Math.PI * 2);
      const idx = Math.floor(a / ((Math.PI * 2) / categories.length));
      if (idx >= 0 && idx < categories.length) onSelectSector(idx);
    },
    [categories.length, onSelectSector, toLocal],
  );

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = toLocal(e);
      const dist = Math.sqrt(x * x + y * y);
      const hubLimit = 25 * (canvasSize / 380);
      const outerLimit = 165 * (canvasSize / 380);
      if (dist < hubLimit || dist > outerLimit) { onHoverSector(null); return; }
      const a = (Math.atan2(y, x) + Math.PI * 2.5) % (Math.PI * 2);
      const idx = Math.floor(a / ((Math.PI * 2) / categories.length));
      onHoverSector(idx >= 0 && idx < categories.length ? idx : null);
    },
    [categories.length, onHoverSector, toLocal, canvasSize],
  );

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMove}
        onMouseLeave={() => onHoverSector(null)}
        style={{ cursor: "pointer" }}
      />
    </div>
  );
}
