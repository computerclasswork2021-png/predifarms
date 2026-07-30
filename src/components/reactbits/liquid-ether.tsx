import { useEffect, useRef } from "react";

/**
 * LiquidEther — an ambient fluid-metaball field rendered to canvas.
 *
 * Performance rules baked in:
 *  - stops entirely when the section scrolls out of view or the tab hides
 *  - honours prefers-reduced-motion by painting a single static frame
 *  - device pixel ratio capped at 1.5, renders into a downscaled buffer
 */
export default function LiquidEther({
  className = "",
  intensity = 1,
}: {
  className?: string;
  intensity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0.5, y: 0.4, tx: 0.5, ty: 0.4 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cv: HTMLCanvasElement = canvas;
    const c2d = cv.getContext("2d", { alpha: true });
    if (!c2d) return;
    const ctx: CanvasRenderingContext2D = c2d;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const SCALE = 0.35; // render small, upscale with blur — cheap and soft

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    let t = 0;

    const blobs = [
      { r: 0.42, hue: 152, sat: 72, light: 34, sx: 0.00042, sy: 0.00031, px: 0.28, py: 0.35 },
      { r: 0.34, hue: 168, sat: 60, light: 28, sx: -0.00035, sy: 0.00046, px: 0.72, py: 0.3 },
      { r: 0.3, hue: 78, sat: 65, light: 30, sx: 0.00051, sy: -0.00038, px: 0.55, py: 0.72 },
      { r: 0.26, hue: 196, sat: 55, light: 26, sx: -0.00047, sy: -0.0003, px: 0.2, py: 0.7 },
    ];

    function resize() {
      const rect = cv.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width * SCALE * dpr));
      h = Math.max(1, Math.floor(rect.height * SCALE * dpr));
      cv.width = w;
      cv.height = h;
    }

    function draw(time: number) {
      t = time;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      const p = pointer.current;
      p.x += (p.tx - p.x) * 0.045;
      p.y += (p.ty - p.y) * 0.045;

      blobs.forEach((b, i) => {
        const drift = reduced ? 0 : t;
        const cx = (b.px + Math.sin(drift * b.sx + i) * 0.12 + (p.x - 0.5) * 0.16) * w;
        const cy = (b.py + Math.cos(drift * b.sy + i * 1.7) * 0.12 + (p.y - 0.5) * 0.16) * h;
        const radius = b.r * Math.max(w, h) * (0.9 + Math.sin(drift * 0.0004 + i) * 0.08);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        const alpha = 0.55 * intensity;
        grad.addColorStop(0, `hsla(${b.hue}, ${b.sat}%, ${b.light + 14}%, ${alpha})`);
        grad.addColorStop(0.55, `hsla(${b.hue}, ${b.sat}%, ${b.light}%, ${alpha * 0.45})`);
        grad.addColorStop(1, `hsla(${b.hue}, ${b.sat}%, ${b.light}%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalCompositeOperation = "source-over";
    }

    function loop(time: number) {
      if (!running) return;
      draw(time);
      raf = requestAnimationFrame(loop);
    }

    function onPointer(e: PointerEvent) {
      const rect = cv.getBoundingClientRect();
      pointer.current.tx = (e.clientX - rect.left) / rect.width;
      pointer.current.ty = (e.clientY - rect.top) / rect.height;
    }

    function start() {
      if (running || reduced) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    resize();
    draw(0);

    if (reduced) {
      running = false;
    } else {
      raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(() => {
      resize();
      draw(t);
    });
    ro.observe(cv);

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0.01 },
    );
    io.observe(cv);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none h-full w-full ${className}`}
      style={{ filter: "blur(48px) saturate(150%)", opacity: 0.9 }}
    />
  );
}
