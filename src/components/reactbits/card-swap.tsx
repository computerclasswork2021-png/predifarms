import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface SwapCard {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * CardSwap — a shuffling deck that cycles through product capabilities.
 * Auto-advances, pauses on hover/focus, and is fully keyboard-navigable
 * through the label pills below the deck.
 */
export default function CardSwap({
  cards,
  interval = 4200,
  className,
}: {
  cards: SwapCard[];
  interval?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % cards.length), interval);
    return () => clearInterval(id);
  }, [paused, cards.length, interval]);

  return (
    <div className={cn("select-none", className)}>
      <div
        className="relative h-[340px] w-full sm:h-[360px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <AnimatePresence initial={false}>
          {cards.map((card, i) => {
            const offset = (i - index + cards.length) % cards.length;
            if (offset > 2) return null;
            return (
              <motion.div
                key={card.id}
                initial={false}
                animate={{
                  y: offset * 18,
                  scale: 1 - offset * 0.05,
                  opacity: offset === 0 ? 1 : 0.55 - offset * 0.14,
                  rotateX: reduced ? 0 : offset * 2,
                  zIndex: cards.length - offset,
                }}
                transition={{ type: "spring", stiffness: 220, damping: 28, mass: 0.7 }}
                className={cn(
                  "absolute inset-x-0 top-0 overflow-hidden rounded-3xl border border-glass-border",
                  "bg-surface-1/85 backdrop-blur-xl grain",
                  offset === 0 && "shadow-[0_30px_80px_-40px_oklch(0.75_0.17_155/0.5)]",
                )}
                style={{ pointerEvents: offset === 0 ? "auto" : "none" }}
                aria-hidden={offset !== 0}
              >
                {card.content}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {cards.map((card, i) => (
          <button
            key={card.id}
            onClick={() => setIndex(i)}
            aria-pressed={i === index}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              i === index
                ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {card.label}
          </button>
        ))}
      </div>
    </div>
  );
}
