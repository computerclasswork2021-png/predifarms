import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  animate,
} from "motion/react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export function Panel({
  children,
  className,
  interactive,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-3xl border border-glass-border bg-surface-1/55 backdrop-blur-xl grain",
        interactive && "lift",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A bare editorial block: hairline rules instead of another rounded box. */
export function Slab({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("relative", className)}>{children}</div>;
}

export function Rule({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border/70", className)} aria-hidden />;
}

/* ------------------------------------------------------------------ */
/* Headings                                                            */
/* ------------------------------------------------------------------ */

export function SectionHeading({
  title,
  hint,
  action,
  icon: Icon,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        <h2 className="type-section flex min-w-0 items-center gap-2.5">
          {Icon && <Icon className="size-4 shrink-0 text-primary" />}
          <span className="truncate">{title}</span>
        </h2>
        {hint && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{hint}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
  aside,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  actions?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden px-5 pb-12 pt-14 sm:px-8 lg:px-14 lg:pt-20">
      <div
        aria-hidden
        className="ambient-orb pointer-events-none absolute -right-40 -top-52 size-[34rem] rounded-full bg-primary/8 blur-[120px]"
      />
      <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-end">
        <Reveal className="min-w-0">
          <p className="type-eyebrow text-primary">{eyebrow}</p>
          <h1 className="type-title mt-5 max-w-3xl">{title}</h1>
          {lede && (
            <p className="mt-6 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground">
              {lede}
            </p>
          )}
          {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
        </Reveal>
        {aside && (
          <Reveal delay={0.1} className="min-w-0">
            {aside}
          </Reveal>
        )}
      </div>
    </header>
  );
}

export function PageBody({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-16 px-5 pb-24 sm:px-8 lg:px-14 lg:pb-28">{children}</div>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons — magnetic pull + ink ripple                                */
/* ------------------------------------------------------------------ */

function useMagnet(strength = 0.28) {
  const ref = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 22, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 260, damping: 22, mass: 0.4 });

  function onMove(e: React.PointerEvent) {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }
  function reset() {
    x.set(0);
    y.set(0);
  }
  return { ref, onMove, reset, style: reduced ? undefined : { x: sx, y: sy } };
}

function useRipple() {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  function spawn(e: React.MouseEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setRipples((prev) => [...prev, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setRipples((prev) => prev.filter((p) => p.id !== id)), 650);
  }
  const nodes = ripples.map((r) => (
    <span
      key={r.id}
      aria-hidden
      className="ripple-ink pointer-events-none absolute size-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current"
      style={{ left: r.x, top: r.y }}
    />
  ));
  return { spawn, nodes };
}

export function PrimaryButton({
  children,
  className,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const magnet = useMagnet();
  const ripple = useRipple();
  return (
    <motion.button
      {...(props as React.ComponentProps<typeof motion.button>)}
      ref={magnet.ref as React.Ref<HTMLButtonElement>}
      onPointerMove={magnet.onMove}
      onPointerLeave={magnet.reset}
      onClick={(e) => {
        ripple.spawn(e);
        onClick?.(e as React.MouseEvent<HTMLButtonElement>);
      }}
      style={magnet.style}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative inline-flex min-h-12 items-center gap-2 overflow-hidden rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground",
        "transition-shadow duration-300 hover:shadow-[0_18px_46px_-18px_oklch(0.75_0.17_155/0.95)]",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      {ripple.nodes}
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

export function GhostButton({
  children,
  className,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const magnet = useMagnet(0.18);
  const ripple = useRipple();
  return (
    <motion.button
      {...(props as React.ComponentProps<typeof motion.button>)}
      ref={magnet.ref as React.Ref<HTMLButtonElement>}
      onPointerMove={magnet.onMove}
      onPointerLeave={magnet.reset}
      onClick={(e) => {
        ripple.spawn(e);
        onClick?.(e as React.MouseEvent<HTMLButtonElement>);
      }}
      style={magnet.style}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative inline-flex min-h-12 items-center gap-2 overflow-hidden rounded-full border border-glass-border bg-surface-1/50 px-6 text-sm font-medium",
        "transition-colors duration-300 hover:border-primary/25 hover:bg-surface-2/70",
        className,
      )}
    >
      {ripple.nodes}
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Numbers                                                             */
/* ------------------------------------------------------------------ */

export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(display, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, reduced]);

  return (
    <span ref={ref} className={cn("type-numeral", className)}>
      {prefix}
      {display.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

/** Big editorial figure with an inline caption — replaces the metric card. */
export function KeyFigure({
  label,
  value,
  unit,
  note,
  tone = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  note?: string;
  tone?: "default" | "good" | "warn" | "bad";
  className?: string;
}) {
  const toneClass = {
    default: "text-foreground",
    good: "text-primary",
    warn: "text-amber",
    bad: "text-destructive",
  }[tone];
  return (
    <div className={cn("group min-w-0", className)}>
      <p className="type-eyebrow text-muted-foreground/70">{label}</p>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className={cn("type-numeral text-3xl sm:text-4xl", toneClass)}>{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </p>
      {note && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{note}</p>}
    </div>
  );
}

/** Kept for compatibility — now renders as an inline figure, not a card. */
export function StatTile({
  label,
  value,
  unit,
  sub,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  icon?: LucideIcon;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneClass = {
    default: "text-foreground",
    good: "text-primary",
    warn: "text-amber",
    bad: "text-destructive",
  }[tone];
  return (
    <div className="group relative min-w-0 border-l border-border/70 py-1 pl-5 transition-colors duration-300 hover:border-primary/40">
      <div className="flex items-center gap-2">
        <p className="type-eyebrow truncate text-muted-foreground/70">{label}</p>
        {Icon && (
          <Icon
            className={cn(
              "size-3.5 shrink-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
              toneClass,
            )}
          />
        )}
      </div>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className={cn("type-numeral text-3xl", toneClass)}>{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </p>
      {sub && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

export function Meter({
  value,
  max = 100,
  tone = "good",
  className,
}: {
  value: number;
  max?: number;
  tone?: "good" | "warn" | "bad" | "info";
  className?: string;
}) {
  const reduced = useReducedMotion();
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const bg = {
    good: "bg-primary",
    warn: "bg-amber",
    bad: "bg-destructive",
    info: "bg-sky",
  }[tone];
  return (
    <div className={cn("h-px w-full overflow-hidden bg-border/80", className)}>
      <motion.div
        className={cn("h-full", bg)}
        initial={reduced ? false : { width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        style={reduced ? { width: `${pct}%` } : undefined}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 88,
  stroke = 3,
  tone = "good",
  label,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: "good" | "warn" | "bad" | "info";
  label?: string;
  children?: ReactNode;
}) {
  const reduced = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const color = {
    good: "var(--primary)",
    warn: "var(--amber)",
    bad: "var(--destructive)",
    info: "var(--sky)",
  }[tone];
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduced ? false : { strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c - (pct / 100) * c }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={reduced ? { strokeDashoffset: c - (pct / 100) * c } : undefined}
        />
      </svg>
      <div className="absolute grid place-items-center text-center">
        {children ?? (
          <>
            <span className="type-numeral text-lg">{Math.round(pct)}</span>
            {label && (
              <span className="type-eyebrow text-[9px] text-muted-foreground">{label}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small parts                                                         */
/* ------------------------------------------------------------------ */

export function Pill({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: "muted" | "good" | "warn" | "bad" | "info";
  className?: string;
}) {
  const tones = {
    muted: "text-muted-foreground ring-white/10",
    good: "text-primary ring-primary/25",
    warn: "text-amber ring-amber/25",
    bad: "text-destructive ring-destructive/25",
    info: "text-sky ring-sky/25",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium ring-1 backdrop-blur-sm",
        tones,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-border/80 px-8 py-20 text-center">
      <div
        aria-hidden
        className="ambient-orb pointer-events-none absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/6 blur-[90px]"
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-md"
      >
        <Icon className="mx-auto size-6 text-primary/70" />
        <h3 className="type-section mt-6">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
        {action && <div className="mt-7 flex justify-center">{action}</div>}
      </motion.div>
    </div>
  );
}

export function SkeletonLines({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="shimmer h-3 rounded-full bg-surface-2/70"
          style={{ width: `${100 - i * 12}%` }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Motion helpers                                                      */
/* ------------------------------------------------------------------ */

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
} as const;

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
} as const;

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
