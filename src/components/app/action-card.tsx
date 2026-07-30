import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import {
  Check,
  Droplets,
  SprayCan,
  Leaf,
  Scissors,
  Search,
  Sprout,
  IndianRupee,
  Info,
  Ban,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINR, type ActionKind, type ActionUrgency, type FarmAction } from "@/lib/farm";
import { useFarm } from "@/lib/farm-store";
import { Pill } from "./primitives";

const KIND_ICON: Record<ActionKind, typeof Droplets> = {
  irrigate: Droplets,
  spray: SprayCan,
  nutrient: Leaf,
  harvest: Scissors,
  scout: Search,
  sow: Sprout,
  sell: IndianRupee,
};

const URGENCY: Record<
  ActionUrgency,
  { label: string; tone: "bad" | "warn" | "good" | "muted"; accent: string }
> = {
  critical: { label: "Do first", tone: "bad", accent: "bg-destructive" },
  today: { label: "Today", tone: "warn", accent: "bg-amber" },
  "this-week": { label: "This week", tone: "good", accent: "bg-primary" },
  planned: { label: "Planned", tone: "muted", accent: "bg-muted-foreground/50" },
};

export default function ActionCard({
  action,
  showBlockLink = true,
}: {
  action: FarmAction;
  showBlockLink?: boolean;
}) {
  const { isDone, toggleDone } = useFarm();
  const reduced = useReducedMotion();
  const done = isDone(action.id);
  const Icon = KIND_ICON[action.kind];
  const u = URGENCY[action.urgency];

  return (
    <motion.article
      layout={!reduced}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-glass-border bg-surface-1/70 backdrop-blur-xl grain",
        "transition-[border-color,box-shadow,opacity] duration-300",
        done
          ? "opacity-55"
          : "hover:border-primary/25 hover:shadow-[0_20px_60px_-40px_oklch(0.75_0.17_155/0.9)]",
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-[3px]", u.accent)} aria-hidden />

      <div className="p-4 pl-5 sm:p-5 sm:pl-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl",
                done ? "bg-surface-2 text-muted-foreground" : "bg-primary/12 text-primary",
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={u.tone}>{u.label}</Pill>
                {showBlockLink && (
                  <Link
                    to="/fields/$blockId"
                    params={{ blockId: action.blockId }}
                    preload="intent"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-primary"
                  >
                    {action.blockName}
                    <ArrowUpRight className="size-3" />
                  </Link>
                )}
              </div>
              <h3
                className={cn(
                  "mt-2 text-[0.95rem] font-semibold leading-snug",
                  done && "line-through decoration-muted-foreground/50",
                )}
              >
                {action.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {action.detail}
              </p>
            </div>
          </div>

          <button
            onClick={() => toggleDone(action.id)}
            aria-pressed={done}
            aria-label={done ? `Mark ${action.title} as not done` : `Mark ${action.title} as done`}
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-xl border transition-all duration-200 active:scale-95",
              done
                ? "border-primary/40 bg-primary text-primary-foreground"
                : "border-glass-border bg-surface-2 text-muted-foreground hover:border-primary/40 hover:text-primary",
            )}
          >
            <Check className="size-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Info className="size-3 shrink-0" />
            {action.because}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Pill tone="muted">{action.window}</Pill>
          {action.impact != null && (
            <Pill tone="warn">{formatINR(action.impact)} at stake</Pill>
          )}
          {action.blocked && (
            <Pill tone="bad">
              <Ban className="size-3" />
              {action.blocked}
            </Pill>
          )}
        </div>
      </div>
    </motion.article>
  );
}
