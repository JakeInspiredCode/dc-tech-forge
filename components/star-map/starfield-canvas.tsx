"use client";

import { memo, useEffect, useRef, useCallback } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  layer: number; // parallax layer 0-2
}

interface Nebula {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  color: [number, number, number];
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
}

const STAR_COUNT = 400;
const NEBULA_COUNT = 5;
const PARTICLE_COUNT = 60;
const DUST_COUNT = 200;

function createStars(w: number, h: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 1.8 + 0.3,
      brightness: Math.random() * 0.7 + 0.3,
      twinkleSpeed: Math.random() * 0.003 + 0.001,
      twinkleOffset: Math.random() * Math.PI * 2,
      layer: Math.floor(Math.random() * 3),
    });
  }
  return stars;
}

interface DustMote {
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: [number, number, number];
}

function createNebulae(w: number, h: number): Nebula[] {
  const colors: [number, number, number][] = [
    [6, 100, 180],    // deep blue
    [80, 20, 140],    // purple
    [6, 140, 140],    // teal
    [120, 30, 60],    // reddish-purple
    [60, 40, 10],     // deep gold
  ];
  return colors.map((color) => ({
    x: w * (0.15 + Math.random() * 0.7),
    y: h * (0.15 + Math.random() * 0.7),
    radiusX: w * (0.18 + Math.random() * 0.18),
    radiusY: h * (0.14 + Math.random() * 0.14),
    color,
    opacity: 0.05 + Math.random() * 0.05,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.0001,
  }));
}

function createDust(w: number, h: number): DustMote[] {
  const dustColors: [number, number, number][] = [
    [140, 120, 80],   // warm dust
    [100, 80, 60],    // brown dust
    [80, 100, 140],   // cool dust
    [120, 100, 140],  // purple dust
  ];
  const motes: DustMote[] = [];
  for (let i = 0; i < DUST_COUNT; i++) {
    motes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 0.4 + 0.2,
      opacity: Math.random() * 0.04 + 0.02,
      color: dustColors[Math.floor(Math.random() * dustColors.length)],
    });
  }
  return motes;
}

function createParticles(w: number, h: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(resetParticle(w, h));
  }
  return particles;
}

function resetParticle(w: number, h: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * 0.15 + 0.05;
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: Math.random() * 600 + 200,
    size: Math.random() * 1.2 + 0.3,
    opacity: 0,
  };
}

function StarfieldCanvasImpl() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const nebulaeRef = useRef<Nebula[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const dustRef = useRef<DustMote[]>([]);
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const reducedMotion = useReducedMotion();

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const time = timeRef.current;

    // Clear
    ctx.fillStyle = "#060510";
    ctx.fillRect(0, 0, w, h);

    // Draw nebulae
    for (const neb of nebulaeRef.current) {
      neb.rotation += neb.rotationSpeed;

      ctx.save();
      ctx.translate(neb.x, neb.y);
      ctx.rotate(neb.rotation);

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, neb.radiusX);
      const [r, g, b] = neb.color;
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${neb.opacity})`);
      gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${neb.opacity * 0.5})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = gradient;
      ctx.scale(1, neb.radiusY / neb.radiusX);
      ctx.beginPath();
      ctx.arc(0, 0, neb.radiusX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw cosmic dust (static warm-toned particles for depth)
    for (const mote of dustRef.current) {
      const [r, g, b] = mote.color;
      ctx.globalAlpha = mote.opacity;
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(mote.x, mote.y, mote.size, mote.size);
    }
    ctx.globalAlpha = 1;

    // Draw stars
    for (const star of starsRef.current) {
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
      const alpha = star.brightness * (0.5 + twinkle * 0.5);

      // Parallax drift
      const driftX = Math.sin(time * 0.0002 * (star.layer + 1)) * (star.layer + 1) * 2;
      const driftY = Math.cos(time * 0.00015 * (star.layer + 1)) * (star.layer + 1) * 1.5;

      // Mouse parallax (subtle)
      const mx = (mouseRef.current.x / w - 0.5) * (star.layer + 1) * 3;
      const my = (mouseRef.current.y / h - 0.5) * (star.layer + 1) * 3;

      const sx = star.x + driftX + mx;
      const sy = star.y + driftY + my;

      ctx.globalAlpha = alpha;

      if (star.size > 1.2) {
        // Bigger stars get a glow
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, star.size * 3);
        glow.addColorStop(0, `rgba(200, 220, 255, ${alpha * 0.5})`);
        glow.addColorStop(1, "rgba(200, 220, 255, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, sy, star.size * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Star core
      ctx.fillStyle = star.layer === 0
        ? `rgba(220, 235, 255, ${alpha})`
        : star.layer === 1
        ? `rgba(200, 220, 245, ${alpha})`
        : `rgba(180, 200, 230, ${alpha * 0.8})`;

      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    // Draw particles (interstellar streams)
    for (let i = 0; i < particlesRef.current.length; i++) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;

      // Fade in/out
      const lifeRatio = p.life / p.maxLife;
      p.opacity = lifeRatio < 0.1
        ? lifeRatio * 10
        : lifeRatio > 0.8
        ? (1 - lifeRatio) * 5
        : 1;

      if (p.life >= p.maxLife || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) {
        particlesRef.current[i] = resetParticle(w, h);
        continue;
      }

      ctx.globalAlpha = p.opacity * 0.3;
      ctx.fillStyle = "#06d6d6";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Trail
      ctx.globalAlpha = p.opacity * 0.1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 8, p.y - p.vy * 8);
      ctx.strokeStyle = "#06d6d6";
      ctx.lineWidth = p.size * 0.5;
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx.scale(dpr, dpr);

      starsRef.current = createStars(w, h);
      nebulaeRef.current = createNebulae(w, h);
      particlesRef.current = createParticles(w, h);
      dustRef.current = createDust(w, h);

      // Reduced motion: the sky is a still image, repainted only on resize.
      if (reducedMotion) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw(ctx, w, h);
      }
    }

    resize();
    window.addEventListener("resize", resize);

    if (reducedMotion) {
      return () => window.removeEventListener("resize", resize);
    }

    // Mouse tracking for parallax
    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouse);

    // 30fps animation loop
    let lastFrame = 0;
    const frameInterval = 1000 / 30;

    function loop(timestamp: number) {
      const elapsed = timestamp - lastFrame;
      if (elapsed >= frameInterval) {
        lastFrame = timestamp - (elapsed % frameInterval);
        timeRef.current = timestamp;
        const w = canvas!.width / dpr;
        const h = canvas!.height / dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw(ctx, w, h);
      }
      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, [draw, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}

// Starfield has no props and owns its own animation loop via refs.
// Memoizing prevents parent re-renders from remounting the canvas, which
// would otherwise re-allocate ~665 particle objects per re-render.
const StarfieldCanvas = memo(StarfieldCanvasImpl);
export default StarfieldCanvas;
