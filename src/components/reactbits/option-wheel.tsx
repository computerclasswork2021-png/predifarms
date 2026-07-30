import { useCallback, useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface WheelOption {
  value: string;
  label: string;
  hint?: string;
}

/**
 * OptionWheel — a radial selector for a small set of mutually exclusive
 * parameters. Behaves as a real radiogroup: arrow keys move the selection,
 * every option is a focusable button, and the dial is only decoration.
 */
export default function OptionWheel({
  options,
  value,
  onChange,
  label,
  size = 220,
}: {
  options: WheelOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  size?: number;
}) {
  const id = useId();
  const reduced = useReducedMotion();
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const step = 360 / options.length;
  const radius = size / 2 - 30;

  const move = useCallback(
    (delta: number) => {
      const next = (index + delta + options.length) % options.length;
      onChange(options[next].value);
    },
    [index, onChange, options],
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <p id={id} className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={id}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            move(1);
          }
          if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            move(-1);
          }
        }}
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* dial */}
        <div className="absolute inset-0 rounded-full border border-glass-border bg-surface-1/60 backdrop-blur-xl" />
        <div className="absolute inset-6 rounded-full border border-dashed border-white/8" />
        <motion.div
          aria-hidden
          animate={{ rotate: index * step }}
          transition={
            reduced ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 24 }
          }
          className="absolute inset-0"
        >
          <div className="absolute left-1/2 top-2 h-[calc(50%-0.5rem)] w-px -translate-x-1/2 bg-linear-to-b from-primary to-transparent" />
        </motion.div>

        {/* centre readout */}
        <div className="absolute inset-0 grid place-items-center px-10 text-center">
          <div>
            <p className="text-lg font-semibold leading-tight">{options[index]?.label}</p>
            {options[index]?.hint && (
              <p className="mt-1 text-[11px] text-muted-foreground">{options[index].hint}</p>
            )}
          </div>
        </div>

        {options.map((opt, i) => {
          const angle = (i * step - 90) * (Math.PI / 180);
          const x = size / 2 + Math.cos(angle) * radius;
          const y = size / 2 + Math.sin(angle) * radius;
          const active = i === index;
          return (
            <button
              key={opt.value}
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(opt.value)}
              title={opt.label}
              className={cn(
                "absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full",
                "text-[10px] font-semibold transition-all duration-200",
                active
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_-4px_oklch(0.75_0.17_155/0.7)]"
                  : "bg-surface-2 text-muted-foreground hover:bg-surface-3 hover:text-foreground",
              )}
              style={{ left: x, top: y }}
            >
              {opt.label.split(" ")[0].slice(0, 5)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
