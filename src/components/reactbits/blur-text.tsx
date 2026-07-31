import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

type Snapshot = Record<string, string | number>;

const buildKeyframes = (from: Snapshot, steps: Snapshot[]) => {
  const keys = new Set<string>([...Object.keys(from), ...steps.flatMap((s) => Object.keys(s))]);
  const keyframes: Record<string, (string | number)[]> = {};
  keys.forEach((k) => {
    keyframes[k] = [from[k], ...steps.map((s) => s[k])].filter(
      (v): v is string | number => v !== undefined,
    );
  });
  return keyframes;
};

/**
 * BlurText — reveals a headline word-by-word out of a blur. Reduced-motion
 * users get the finished text immediately.
 */
export default function BlurText({
  text = "",
  delay = 120,
  className = "",
  animateBy = "words",
  direction = "top",
  threshold = 0.1,
  rootMargin = "0px",
  stepDuration = 0.35,
  as: Tag = "span",
  onAnimationComplete,
}: {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
  threshold?: number;
  rootMargin?: string;
  stepDuration?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  onAnimationComplete?: () => void;
}) {
  const reduced = useReducedMotion();
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(node);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const from = useMemo<Snapshot>(
    () =>
      direction === "top"
        ? { filter: "blur(10px)", opacity: 0, y: -24 }
        : { filter: "blur(10px)", opacity: 0, y: 24 },
    [direction],
  );
  const to = useMemo<Snapshot[]>(
    () => [
      { filter: "blur(5px)", opacity: 0.5, y: direction === "top" ? 4 : -4 },
      { filter: "blur(0px)", opacity: 1, y: 0 },
    ],
    [direction],
  );

  if (reduced) {
    return <Tag className={className}>{text}</Tag>;
  }

  const stepCount = to.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, i) => i / (stepCount - 1));
  const keyframes = buildKeyframes(from, to);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={className}
      style={{ display: "inline-flex", flexWrap: "wrap" }}
    >
      {elements.map((segment, index) => (
        <motion.span
          key={`${segment}-${index}`}
          className="inline-block will-change-[transform,filter,opacity]"
          initial={from}
          animate={inView ? (keyframes as never) : from}
          transition={{ duration: totalDuration, times, delay: (index * delay) / 1000 }}
          onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
        >
          {segment === " " ? "\u00A0" : segment}
          {animateBy === "words" && index < elements.length - 1 && "\u00A0"}
        </motion.span>
      ))}
    </Tag>
  );
}
