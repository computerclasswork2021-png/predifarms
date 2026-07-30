import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * FluidGlass — a decorative refractive glass panel that tilts subtly toward
 * the pointer. Purely ornamental, so it is inert to screen readers and
 * completely static under reduced-motion.
 */
export default function FluidGlass({
  children,
  className,
  tilt = 6,
}: {
  children?: ReactNode;
  className?: string;
  tilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 140, damping: 18 });
  const sry = useSpring(ry, { stiffness: 140, damping: 18 });

  function onMove(e: React.PointerEvent) {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * tilt * 2);
    rx.set(-py * tilt * 2);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      style={reduced ? undefined : { rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10",
        "bg-[linear-gradient(140deg,oklch(1_0_0/0.09),oklch(1_0_0/0.02)_45%,oklch(0.75_0.17_155/0.08))]",
        "backdrop-blur-2xl grain",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/2 rotate-12 bg-[linear-gradient(90deg,transparent,oklch(1_0_0/0.10),transparent)]"
      />
      {children}
    </motion.div>
  );
}
