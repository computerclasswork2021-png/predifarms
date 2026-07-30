import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

export interface StackItem {
  id: string;
  content: ReactNode;
}

function StackCard({
  item,
  index,
  total,
}: {
  item: StackItem;
  index: number;
  total: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 65%", "start 12%"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.55]);
  const y = useTransform(scrollYProgress, [0, 1], [40, 0]);

  return (
    <div ref={ref} className="sticky" style={{ top: `calc(6rem + ${index * 18}px)` }}>
      <motion.div
        style={
          reduced
            ? undefined
            : { scale, opacity, y, zIndex: total - index }
        }
        className="will-change-transform"
      >
        {item.content}
      </motion.div>
    </div>
  );
}

/**
 * ScrollStack — cards that stack and recede as the story scrolls,
 * used for the landing-page narrative. Falls back to a plain stack
 * when the visitor prefers reduced motion.
 */
export default function ScrollStack({ items }: { items: StackItem[] }) {
  return (
    <div className="flex flex-col gap-6">
      {items.map((item, i) => (
        <StackCard key={item.id} item={item} index={i} total={items.length} />
      ))}
    </div>
  );
}
