import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, CloudRain, Leaf, LineChart, Sprout } from "lucide-react";
import { lazy, Suspense } from "react";
import LiquidEther from "@/components/reactbits/liquid-ether";
import MagicRings from "@/components/reactbits/magic-rings";
import StaggeredMenu from "@/components/reactbits/staggered-menu";

const FluidGlass = lazy(() => import("@/components/reactbits/fluid-glass-3d"));
import CardSwap, { type SwapCard } from "@/components/reactbits/card-swap";
import { KeyFigure, Reveal, Rule } from "@/components/app/primitives";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PREDI-FARM X — One plan for the whole farm" },
      {
        name: "description",
        content:
          "Weather, soil moisture, crop stage and mandi prices reconciled into a single ordered plan for the day. Built for smallholder farms.",
      },
      { property: "og:title", content: "PREDI-FARM X — One plan for the whole farm" },
      {
        property: "og:description",
        content:
          "Weather, soil moisture, crop stage and mandi prices reconciled into a single ordered plan for the day. Built for smallholder farms.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const CARDS: SwapCard[] = [
  {
    id: "plan",
    label: "Daily plan",
    content: (
      <div className="flex h-full flex-col justify-between p-7">
        <div>
          <p className="type-eyebrow text-primary">Ordered by cost of delay</p>
          <p className="mt-4 text-lg font-medium leading-snug">
            Irrigate Block B before 10:00 — 42 mm deficit, no rain for four days.
          </p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Every task carries the reason behind it, so the call is yours to overrule.
        </p>
      </div>
    ),
  },
  {
    id: "weather",
    label: "Weather",
    content: (
      <div className="flex h-full flex-col justify-between p-7">
        <div>
          <p className="type-eyebrow text-primary">Read as field operations</p>
          <p className="mt-4 text-lg font-medium leading-snug">
            24 mm arriving Thursday. Spray window closes Wednesday evening.
          </p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Forecast translated into what you can and cannot do, block by block.
        </p>
      </div>
    ),
  },
  {
    id: "money",
    label: "Money",
    content: (
      <div className="flex h-full flex-col justify-between p-7">
        <div>
          <p className="type-eyebrow text-primary">Standing crop value</p>
          <p className="type-numeral mt-4 text-4xl">₹4,82,000</p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Gross at today's mandi rates, tracked against input cost per block.
        </p>
      </div>
    ),
  },
];

function Landing() {
  return (
    <div className="relative min-h-dvh bg-background">
      {/* Hero */}
      <section className="relative flex min-h-[92vh] flex-col justify-end overflow-hidden">
        <LiquidEther className="absolute inset-0" intensity={0.85} />
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <MagicRings opacity={0.5} blur={2} ringCount={5} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,oklch(0.11_0.018_155/0.55)_0%,transparent_35%,var(--background)_98%)]" />

        <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-6 sm:px-8 lg:px-14">
          <span className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
              <Leaf className="size-4 text-primary" />
            </span>
            <span className="text-sm font-semibold tracking-tight">PREDI-FARM X</span>
          </span>
          <span className="flex items-center gap-3">
            <Link
              to="/auth"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <StaggeredMenu
              items={[
                { label: "Today", link: "/dashboard" },
                { label: "Fields", link: "/fields" },
                { label: "Soil", link: "/soil" },
                { label: "Mandi", link: "/mandi" },
                { label: "Settings", link: "/settings" },
              ]}
            />
          </span>
        </header>

        <div className="relative z-10 px-5 pb-20 sm:px-8 lg:px-14">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="type-eyebrow text-primary"
          >
            One farm. One plan. One morning at a time.
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 22, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.95, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="type-display mt-6 max-w-[16ch]"
          >
            Know what the field needs before it tells you.
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/dashboard"
              preload="intent"
              className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-shadow duration-300 hover:shadow-[0_18px_46px_-18px_oklch(0.75_0.17_155/0.95)]"
            >
              Open today's plan
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Live weather, soil moisture and crop stage reconciled into a single ordered list —
              with the reason behind every call.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Figures — editorial, no cards */}
      <section className="px-5 py-24 sm:px-8 lg:px-14">
        <Rule />
        <div className="grid gap-10 pt-10 sm:grid-cols-3">
          <Reveal>
            <KeyFigure label="Decisions a day" value="17" note="Reconciled across every block." />
          </Reveal>
          <Reveal delay={0.08}>
            <KeyFigure
              label="Forecast horizon"
              value="7"
              unit="days"
              tone="good"
              note="Rain, wind and spray windows."
            />
          </Reveal>
          <Reveal delay={0.16}>
            <KeyFigure
              label="Water saved"
              value="31"
              unit="%"
              tone="good"
              note="Against fixed-schedule irrigation."
            />
          </Reveal>
        </div>
      </section>

      {/* Deck */}
      <section className="grid gap-14 px-5 pb-28 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center lg:px-14">
        <Reveal>
          <p className="type-eyebrow text-primary">What you actually see</p>
          <h2 className="type-title mt-5 max-w-[14ch]">
            Not a dashboard. A decision, then the next one.
          </h2>
          <ul className="mt-9 space-y-5">
            {[
              { icon: Sprout, text: "Every block carries its own stage — never a farm-wide average." },
              { icon: CloudRain, text: "Weather arrives as an operation, not as an icon." },
              { icon: LineChart, text: "Money tracked against input cost, per block, per season." },
            ].map((row) => (
              <li key={row.text} className="flex gap-4">
                <row.icon className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="text-sm leading-relaxed text-muted-foreground">{row.text}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <CardSwap cards={CARDS} />
        </Reveal>
      </section>

      <footer className="px-5 pb-14 sm:px-8 lg:px-14">
        <Rule />
        <p className="pt-6 text-xs text-muted-foreground">PREDI-FARM X</p>
      </footer>
    </div>
  );
}
