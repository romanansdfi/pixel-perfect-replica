import { useEffect, useRef } from "react";

type Petal = {
  x: number;
  y: number;
  size: number;
  speedY: number;
  sway: number;
  swaySpeed: number;
  angle: number;
  spin: number;
  kind: "petal" | "heart";
  alpha: number;
};

/** Full-screen canvas of drifting rose petals and tiny hearts. */
export function FloatingPetals() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let petals: Petal[] = [];

    const spawn = (initial: boolean): Petal => {
      const isHeart = Math.random() < 0.28;
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : -30,
        size: isHeart ? 6 + Math.random() * 7 : 8 + Math.random() * 12,
        speedY: 0.35 + Math.random() * 0.85,
        sway: 20 + Math.random() * 40,
        swaySpeed: 0.4 + Math.random() * 0.8,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.02,
        kind: isHeart ? "heart" : "petal",
        alpha: 0.35 + Math.random() * 0.4,
      };
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = w < 640 ? 16 : w < 1024 ? 24 : 34;
      petals = Array.from({ length: count }, () => spawn(true));
    };

    const drawPetal = (p: Petal, t: number) => {
      const x = p.x + Math.sin(t * 0.001 * p.swaySpeed + p.angle) * p.sway * 0.4;
      ctx.save();
      ctx.translate(x, p.y);
      ctx.rotate(p.angle + Math.sin(t * 0.001 + p.angle) * 0.4);
      ctx.globalAlpha = p.alpha;
      if (p.kind === "petal") {
        const s = p.size;
        const grad = ctx.createLinearGradient(0, -s, 0, s);
        grad.addColorStop(0, "rgba(248,187,208,0.95)");
        grad.addColorStop(1, "rgba(232,161,181,0.75)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.bezierCurveTo(s * 0.9, -s * 0.55, s * 0.75, s * 0.65, 0, s);
        ctx.bezierCurveTo(-s * 0.75, s * 0.65, -s * 0.9, -s * 0.55, 0, -s);
        ctx.fill();
      } else {
        const s = p.size / 2;
        ctx.fillStyle = "rgba(199,91,122,0.8)";
        ctx.beginPath();
        ctx.moveTo(0, s);
        ctx.bezierCurveTo(-s * 1.6, -s * 0.3, -s * 0.7, -s * 1.3, 0, -s * 0.5);
        ctx.bezierCurveTo(s * 0.7, -s * 1.3, s * 1.6, -s * 0.3, 0, s);
        ctx.fill();
      }
      ctx.restore();
    };

    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min((t - last) / 16.7, 3);
      last = t;
      ctx.clearRect(0, 0, w, h);
      for (const p of petals) {
        p.y += p.speedY * dt;
        p.angle += p.spin * dt;
        if (p.y > h + 40) Object.assign(p, spawn(false));
        drawPetal(p, t);
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5]"
    />
  );
}
