import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { WeatherDay } from "@/lib/farm";
import type { PartOfDay } from "@/lib/weather";

/**
 * Atmosphere — a purely atmospheric, non-illustrative backdrop.
 *
 * No objects, no scenery: only layered light. Colour temperature and light
 * position follow the time of day; fog density, cloud drift and precipitation
 * follow the weather. Everything is CSS-driven and GPU-composited.
 */

const LIGHT: Record<PartOfDay, { hue: string; low: string; top: number; left: number }> = {
  dawn: { hue: "oklch(0.68 0.14 45)", low: "oklch(0.32 0.07 300)", top: 62, left: 20 },
  morning: { hue: "oklch(0.78 0.11 200)", low: "oklch(0.3 0.05 220)", top: 34, left: 32 },
  afternoon: { hue: "oklch(0.84 0.1 215)", low: "oklch(0.32 0.05 210)", top: 18, left: 58 },
  evening: { hue: "oklch(0.64 0.16 32)", low: "oklch(0.28 0.07 295)", top: 56, left: 78 },
  night: { hue: "oklch(0.46 0.09 258)", low: "oklch(0.15 0.04 265)", top: 40, left: 74 },
};

function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export default function Atmosphere({
  part,
  condition,
  windKph = 8,
  className,
  intensity = 1,
}: {
  part: PartOfDay;
  condition: WeatherDay["condition"];
  windKph?: number;
  className?: string;
  intensity?: number;
}) {
  const night = part === "night";
  const wet = condition === "rain" || condition === "storm";
  const cloudy = wet || condition === "cloudy";
  const light = LIGHT[part];

  const clouds = useMemo(
    () =>
      Array.from({ length: cloudy ? 5 : 3 }, (_, i) => ({
        top: 2 + seeded(i + 1) * 46,
        w: 280 + seeded(i + 9) * 420,
        h: 90 + seeded(i + 5) * 120,
        duration: Math.max(70, 190 + seeded(i + 17) * 90 - windKph * 2),
        delay: -seeded(i + 23) * 160,
        opacity: (night ? 0.14 : cloudy ? 0.24 : 0.13) * intensity,
      })),
    [cloudy, night, windKph, intensity],
  );

  const motes = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: seeded(i + 31) * 100,
        bottom: seeded(i + 37) * 60,
        size: 1 + seeded(i + 41) * 2,
        duration: 14 + seeded(i + 43) * 18,
        delay: -seeded(i + 47) * 26,
      })),
    [],
  );

  const stars = useMemo(
    () =>
      night
        ? Array.from({ length: 26 }, (_, i) => ({
            left: seeded(i + 7) * 100,
            top: seeded(i + 13) * 62,
            size: 1 + seeded(i + 19) * 1.5,
            duration: 3 + seeded(i + 29) * 5,
          }))
        : [],
    [night],
  );

  const drops = useMemo(
    () =>
      wet
        ? Array.from({ length: condition === "storm" ? 34 : 20 }, (_, i) => ({
            left: seeded(i + 3) * 100,
            delay: -seeded(i + 51) * 1.4,
            duration: 0.8 + seeded(i + 53) * 0.6,
            height: 18 + seeded(i + 61) * 26,
          }))
        : [],
    [wet, condition],
  );

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {/* base depth: vertical gradient from horizon light to deep shade */}
      <div
        className="absolute inset-0 transition-[background] duration-[1500ms]"
        style={{
          background: `linear-gradient(180deg, ${light.low} 0%, oklch(0.14 0.02 160) 62%, var(--background) 100%)`,
          opacity: 0.9 * intensity,
        }}
      />

      {/* primary moving light */}
      <div
        className="atmosphere-glow absolute rounded-full blur-[90px]"
        style={{
          top: `${light.top - 40}%`,
          left: `${light.left - 25}%`,
          width: "62%",
          height: "150%",
          background: `radial-gradient(circle at 50% 50%, ${light.hue}, transparent 68%)`,
          opacity: (cloudy ? 0.4 : 0.62) * intensity,
        }}
      />

      {/* counter light — keeps the field from reading flat */}
      <div
        className="atmosphere-glow absolute rounded-full blur-[110px]"
        style={{
          right: "-16%",
          bottom: "-45%",
          width: "58%",
          height: "130%",
          animationDelay: "-9s",
          background:
            "radial-gradient(circle at 50% 50%, oklch(0.72 0.15 155 / 55%), transparent 70%)",
          opacity: 0.42 * intensity,
        }}
      />

      {stars.map((s, i) => (
        <span
          key={`s${i}`}
          className="star absolute rounded-full bg-foreground"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}

      {clouds.map((c, i) => (
        <div
          key={`c${i}`}
          className="cloud-layer absolute blur-3xl"
          style={{
            top: `${c.top}%`,
            width: c.w,
            height: c.h,
            opacity: c.opacity,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
            background: night
              ? "radial-gradient(60% 100% at 45% 55%, oklch(0.5 0.03 250), transparent 72%)"
              : "radial-gradient(60% 100% at 45% 55%, oklch(0.98 0.01 240), transparent 72%)",
          }}
        />
      ))}

      {/* low fog bands */}
      {[0, 1].map((i) => (
        <div
          key={`f${i}`}
          className="fog-band absolute inset-x-[-25%] blur-2xl"
          style={{
            bottom: `${i * 12}%`,
            height: `${26 + i * 10}%`,
            animationDuration: `${46 + i * 22}s`,
            animationDelay: `${-i * 12}s`,
            opacity: (cloudy ? 0.4 : 0.24) * intensity,
            background:
              "linear-gradient(180deg, transparent, oklch(0.8 0.02 200 / 14%) 55%, transparent)",
          }}
        />
      ))}

      {motes.map((m, i) => (
        <span
          key={`m${i}`}
          className="mote absolute rounded-full"
          style={{
            left: `${m.left}%`,
            bottom: `${m.bottom}%`,
            width: m.size,
            height: m.size,
            background: "oklch(0.92 0.06 120 / 60%)",
            animationDuration: `${m.duration}s`,
            animationDelay: `${m.delay}s`,
          }}
        />
      ))}

      {drops.map((d, i) => (
        <span
          key={`d${i}`}
          className="rain-layer absolute w-px"
          style={{
            left: `${d.left}%`,
            top: "-10%",
            height: d.height,
            background: "linear-gradient(180deg, transparent, oklch(0.9 0.03 220 / 40%))",
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
          }}
        />
      ))}

      {/* grade back into the page so nothing has a hard edge */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,oklch(0.11_0.018_155/0.35)_55%,var(--background)_100%)]" />
    </div>
  );
}
