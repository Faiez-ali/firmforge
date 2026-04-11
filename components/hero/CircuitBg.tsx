"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;       // fraction of canvas width
  y: number;       // fraction of canvas height
  size: number;    // 2 = pad, 5 = chip
  glow: number;    // 0–1 current intensity
  glowDir: number; // +1 / -1
  glowSpeed: number;
}

interface Trace {
  from: number;
  to: number;
}

interface Signal {
  from: number;
  to: number;
  t: number;       // 0–1 progress
  speed: number;
  color: string;
  trailLen: number;
}

const PALETTE = [
  "#3b82f6", // blue
  "#06b6d4", // cyan
  "#10b981", // green
  "#8b5cf6", // violet
];

// Deterministic jitter so SSR & client match (no Math.random in initial layout)
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function CircuitBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    let frame = 0;

    // ── Build circuit graph ────────────────────────────────────────────────
    const rand = seededRand(42);
    const COLS = 9;
    const ROWS = 5;

    const nodes: Node[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const xFrac = (c / (COLS - 1)) * 0.88 + 0.06;
        const yFrac = (r / (ROWS - 1)) * 0.82 + 0.09;
        const isChip = rand() > 0.78;
        nodes.push({
          x: xFrac,
          y: yFrac,
          size: isChip ? 5 + rand() * 3 : 2 + rand() * 1.5,
          glow: rand(),
          glowDir: rand() > 0.5 ? 1 : -1,
          glowSpeed: 0.005 + rand() * 0.012,
        });
      }
    }

    const traces: Trace[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        if (c < COLS - 1 && rand() > 0.15) traces.push({ from: idx, to: idx + 1 });
        if (r < ROWS - 1 && rand() > 0.15) traces.push({ from: idx, to: idx + COLS });
      }
    }

    // ── Signal pool ────────────────────────────────────────────────────────
    const signals: Signal[] = [];
    let signalRand = seededRand(99); // separate RNG for dynamic spawning

    const spawnSignal = () => {
      if (!traces.length) return;
      const trace = traces[Math.floor(signalRand() * traces.length)];
      const forward = signalRand() > 0.5;
      signals.push({
        from: forward ? trace.from : trace.to,
        to:   forward ? trace.to   : trace.from,
        t: 0,
        speed: 0.003 + signalRand() * 0.007,
        color: PALETTE[Math.floor(signalRand() * PALETTE.length)],
        trailLen: 0.12 + signalRand() * 0.1,
      });
    };

    for (let i = 0; i < 12; i++) spawnSignal();

    // ── Resize ─────────────────────────────────────────────────────────────
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ── Draw loop ──────────────────────────────────────────────────────────
    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      // --- Traces (dim static lines) ---
      ctx.lineWidth = 1;
      for (const tr of traces) {
        const a = nodes[tr.from], b = nodes[tr.to];
        ctx.beginPath();
        ctx.moveTo(a.x * W, a.y * H);
        ctx.lineTo(b.x * W, b.y * H);
        ctx.strokeStyle = "rgba(59,130,246,0.10)";
        ctx.stroke();
      }

      // --- Signals ---
      for (let i = signals.length - 1; i >= 0; i--) {
        const sig = signals[i];
        sig.t += sig.speed;

        if (sig.t >= 1) {
          signals.splice(i, 1);
          spawnSignal();
          continue;
        }

        const fa = nodes[sig.from], fb = nodes[sig.to];
        const x1 = fa.x * W, y1 = fa.y * H;
        const x2 = fb.x * W, y2 = fb.y * H;

        // Lit trace segment behind signal
        const headX = x1 + (x2 - x1) * sig.t;
        const headY = y1 + (y2 - y1) * sig.t;
        const tailT  = Math.max(0, sig.t - sig.trailLen);
        const tailX  = x1 + (x2 - x1) * tailT;
        const tailY  = y1 + (y2 - y1) * tailT;

        const lineGrad = ctx.createLinearGradient(tailX, tailY, headX, headY);
        lineGrad.addColorStop(0, sig.color + "00");
        lineGrad.addColorStop(1, sig.color + "99");
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Signal head glow
        const grd = ctx.createRadialGradient(headX, headY, 0, headX, headY, 9);
        grd.addColorStop(0, sig.color + "dd");
        grd.addColorStop(0.4, sig.color + "55");
        grd.addColorStop(1, sig.color + "00");
        ctx.beginPath();
        ctx.arc(headX, headY, 9, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      // --- Nodes ---
      for (const n of nodes) {
        n.glow += n.glowDir * n.glowSpeed;
        if (n.glow > 1) { n.glow = 1; n.glowDir = -1; }
        if (n.glow < 0.08) { n.glow = 0.08; n.glowDir = 1; }

        const nx = n.x * W, ny = n.y * H;
        const alpha = 0.15 + n.glow * 0.45;

        if (n.size >= 5) {
          // IC / chip — rectangle
          const s = n.size;
          ctx.strokeStyle = `rgba(59,130,246,${alpha})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(nx - s, ny - s, s * 2, s * 2);
          ctx.fillStyle = `rgba(59,130,246,${alpha * 0.18})`;
          ctx.fillRect(nx - s, ny - s, s * 2, s * 2);

          // Pin stubs (2 per side, left/right)
          ctx.strokeStyle = `rgba(6,182,212,${alpha * 0.6})`;
          ctx.lineWidth = 0.8;
          const pins = 2;
          for (let p = 0; p < pins; p++) {
            const py = ny - s / 2 + (p / (pins - 1)) * s;
            ctx.beginPath(); ctx.moveTo(nx - s, py); ctx.lineTo(nx - s - 5, py); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(nx + s, py); ctx.lineTo(nx + s + 5, py); ctx.stroke();
          }
        } else {
          // Solder pad — small circle
          ctx.beginPath();
          ctx.arc(nx, ny, n.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(6,182,212,${alpha})`;
          ctx.fill();
        }
      }

      // Spawn extra signals periodically
      if (frame % 90 === 0 && signals.length < 22) spawnSignal();
      frame++;

      rafId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.55, willChange: "transform" }}
    />
  );
}
