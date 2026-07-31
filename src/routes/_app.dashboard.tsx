import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CloudRain,
  Droplets,
  Sparkles,
  Sprout,
  Sun,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useFarm } from "@/lib/farm-store";
import {
  blockEconomics,
  formatDate,
  formatINR,
  rainWithin,
  type ActionUrgency,
} from "@/lib/farm";
import ActionCard from "@/components/app/action-card";
import {
  EmptyState,
  GhostButton,
  Meter,
  PageBody,
  PageHeader,
  Panel,
  Pill,
  SectionHeading,
  StatTile,
} from "@/components/app/primitives";
import FluidGlass from "@/components/reactbits/fluid-glass";
import Atmosphere from "@/components/app/atmosphere";
import FarmClock from "@/components/app/farm-clock";
import TaskBoard from "@/components/app/task-board";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Today's Action Plan — PREDI-FARM X" },
      {
        name: "description",
        content:
          "One reconciled plan for the farm: what to irrigate, spray, feed and harvest today, with the reason behind every call.",
      },
      { property: "og:title", content: "Today's Action Plan — PREDI-FARM X" },
      {
        property: "og:description",
        content: "Weather, soil and crop stage reconciled into a single daily plan.",
      },
    ],
  }),
  component: DashboardPage,
});

const FILTERS: Array<{ id: "all" | ActionUrgency; label: string }> = [
  { id: "all", label: "Everything" },
  { id: "critical", label: "Do first" },
  { id: "today", label: "Today" },
  { id: "this-week", label: "This week" },
  { id: "planned", label: "Planned" },
];

function DashboardPage() {
  const {
    farm,
    blocks,
    plan,
    forecast,
    today,
    isDone,
    cropStateFor,
    greeting,
    current,
    partOfDay: part,
    season,
  } = useFarm();

  const [filter, setFilter] = useState<"all" | ActionUrgency>("all");

  const open = plan.filter((a) => !isDone(a.id));
  const doneCount = plan.length - open.length;
  const headline = open[0];

  const visible = useMemo(
    () => (filter === "all" ? plan : plan.filter((a) => a.urgency === filter)),
    [plan, filter],
  );

  const totals = useMemo(() => {
    let revenue = 0;
    let cropped = 0;
    let healthSum = 0;
    let cropCount = 0;
    blocks.forEach((b) => {
      const state = cropStateFor(b.id);
      const econ = blockEconomics(b, state);
      if (econ) {
        revenue += econ.grossRevenue;
        cropped += b.areaHa;
        healthSum += b.health;
        cropCount += 1;
      }
    });
    return {
      revenue,
      cropped,
      health: cropCount ? Math.round(healthSum / cropCount) : 0,
      fallow: farm.areaHa - cropped,
    };
  }, [blocks, cropStateFor, farm.areaHa]);

  const rain3 = rainWithin(forecast, 3);

  const nextHarvest = blocks
    .map((b) => ({ block: b, state: cropStateFor(b.id) }))
    .filter((x) => x.state)
    .sort((a, b) => a.state!.daysToHarvest - b.state!.daysToHarvest)[0];

  return (
    <>
      {/* Living hero — drawn from the real clock and the real forecast */}
      <div className="relative -mt-4 mb-2 h-56 overflow-hidden sm:h-72">
        <Atmosphere part={part} condition={current.condition} windKph={current.windKph} />
        <div className="relative z-10 flex h-full items-end justify-between gap-6 px-5 pb-6 sm:px-8 lg:px-14">
          <div className="min-w-0">
            <p className="type-eyebrow text-primary">
              {season} season · {part}
            </p>
            <p className="type-numeral mt-3 text-5xl sm:text-6xl">{current.tempC}°</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {current.humidity}% humidity · {current.windKph} kph wind · live for {farm.village}
            </p>
          </div>
          <div className="flex max-w-[13rem] flex-col items-end gap-2 text-right">
            <FarmClock
              className="rounded-full border border-glass-border bg-surface-1/60 px-3 py-2 backdrop-blur-xl"
              showDate={false}
            />
            <p className="text-xs text-muted-foreground">{formatDate(today)}</p>
          </div>
        </div>
      </div>

      <PageHeader
        eyebrow={`${forecast[0].label} · ${farm.village}`}

        title={
          headline
            ? `${greeting}, ${farm.farmer.split(" ")[0]}. Start with ${headline.blockName}.`
            : `${greeting}, ${farm.farmer.split(" ")[0]}. Nothing is waiting on you.`
        }
        lede={
          headline
            ? `${headline.title}. ${open.length} open task${open.length === 1 ? "" : "s"} across ${blocks.length} blocks, ${doneCount} already cleared today.`
            : "Every task on today's plan is cleared. The next one appears as conditions change."
        }
        actions={
          <>
            <Link
              to="/fields"
              preload="intent"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[0_10px_30px_-12px_oklch(0.75_0.17_155/0.9)] active:scale-[0.98]"
            >
              <Sprout className="size-4" />
              Walk my fields
            </Link>
            <Link
              to="/weather"
              preload="intent"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-glass-border bg-surface-1/60 px-4 text-sm font-medium transition-colors hover:bg-surface-2"
            >
              <CloudRain className="size-4 text-sky" />
              {rain3 > 5 ? `${Math.round(rain3)} mm rain in 3 days` : "Dry spell ahead"}
            </Link>
          </>
        }
        aside={
          <FluidGlass className="w-full p-5 lg:w-[340px]">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="size-3.5" />
              Why this order
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">
              {headline
                ? headline.because
                : "Soil moisture, disease pressure, crop stage and the 7-day forecast are all inside safe bands."}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
              {[
                { label: "Open", value: open.length },
                { label: "Cleared", value: doneCount },
                { label: "Blocks", value: blocks.length },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-mono text-xl font-semibold tabular-nums">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </FluidGlass>
        }
      />

      <PageBody>
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Land under crop"
            value={totals.cropped}
            unit={`of ${farm.areaHa} ha`}
            sub={totals.fallow > 0 ? `${totals.fallow} ha fallow and earning nothing` : "Fully planted"}
            icon={Sprout}
            tone={totals.fallow > 0 ? "warn" : "good"}
          />
          <StatTile
            label="Average crop health"
            value={totals.health}
            unit="/100"
            sub="Canopy index across cropped blocks"
            icon={CheckCircle2}
            tone={totals.health >= 80 ? "good" : totals.health >= 65 ? "warn" : "bad"}
          />
          <StatTile
            label="Standing crop value"
            value={formatINR(totals.revenue)}
            sub="Gross at today's mandi rates, before costs"
            icon={TrendingUp}
            tone="good"
          />
          <StatTile
            label="Next harvest"
            value={nextHarvest?.state ? `${nextHarvest.state.daysToHarvest}d` : "—"}
            sub={
              nextHarvest?.state
                ? `${nextHarvest.block.name} · ${nextHarvest.state.crop.label} · ${formatDate(nextHarvest.state.harvestDate)}`
                : "No standing crop"
            }
            icon={CalendarClock}
            tone="default"
          />
        </div>

        {/* Plan */}
        <section>
          <SectionHeading
            title="Today's plan"
            hint="Ordered by what costs you the most if it slips. Weather and pre-harvest limits are already applied."
            action={
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    aria-pressed={filter === f.id}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      filter === f.id
                        ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                        : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            }
          />

          {visible.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Nothing in this bucket"
              body="No task matches this filter right now. Switch back to everything to see the full plan."
              action={
                <GhostButton onClick={() => setFilter("all")}>Show everything</GhostButton>
              }
            />
          ) : (
            <motion.div layout className="grid gap-3 xl:grid-cols-2">
              {visible.map((action) => (
                <ActionCard key={action.id} action={action} />
              ))}
            </motion.div>
          )}
        </section>

        <section>
          <SectionHeading
            title="Your own list"
            hint="Anything the engine cannot know — labour, repairs, errands. Saved to your account."
          />
          <TaskBoard />
        </section>



        {/* Blocks + weather */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <section>
            <SectionHeading
              title="Field blocks"
              hint="Each block carries its own stage, not a farm-wide average."
              action={
                <Link
                  to="/fields"
                  preload="intent"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  All fields <ArrowUpRight className="size-3" />
                </Link>
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {blocks.map((b) => {
                const state = cropStateFor(b.id);
                const openTasks = open.filter((a) => a.blockId === b.id).length;
                return (
                  <Link
                    key={b.id}
                    to="/fields/$blockId"
                    params={{ blockId: b.id }}
                    preload="intent"
                    className="group"
                  >
                    <Panel interactive className="h-full p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{b.name}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {state ? `${state.crop.label} · day ${state.dap}` : "Fallow"} ·{" "}
                            {b.areaHa} ha
                          </p>
                        </div>
                        {openTasks > 0 ? (
                          <Pill tone="warn">{openTasks} to do</Pill>
                        ) : (
                          <Pill tone="good">Clear</Pill>
                        )}
                      </div>

                      {state ? (
                        <>
                          <div className="mt-4 flex items-center justify-between text-xs">
                            <span className="font-medium text-primary">{state.stage.name}</span>
                            <span className="text-muted-foreground">
                              harvest {formatDate(state.harvestDate)}
                            </span>
                          </div>
                          <Meter
                            className="mt-2"
                            value={state.progress * 100}
                            tone={state.daysToHarvest < 10 ? "warn" : "good"}
                          />
                          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
                            {[
                              { l: "Health", v: `${b.health}`, tone: b.health >= 80 },
                              { l: "Moisture", v: `${b.soil.moisture}%`, tone: b.soil.moisture >= 45 },
                              { l: "Risk", v: `${b.diseaseRisk}%`, tone: b.diseaseRisk < 50 },
                            ].map((m) => (
                              <div key={m.l}>
                                <p
                                  className={cn(
                                    "font-mono text-sm font-semibold tabular-nums",
                                    m.tone ? "text-foreground" : "text-amber",
                                  )}
                                >
                                  {m.v}
                                </p>
                                <p className="text-[10px] text-muted-foreground">{m.l}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="mt-4 rounded-xl border border-dashed border-amber/30 bg-amber/5 p-3 text-xs text-amber">
                          Fallow land. Open the crop planner to pick what goes in next.
                        </div>
                      )}
                    </Panel>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <SectionHeading title="Next 7 days" hint="Read as field operations, not as icons." />
            <Panel className="divide-y divide-border/60">
              {forecast.map((d) => (
                <div key={d.offset} className="flex items-center gap-3 p-3">
                  <span className="w-16 shrink-0 text-xs font-medium">{d.label}</span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2">
                    {d.rainMm > 5 ? (
                      <CloudRain className="size-4 text-sky" />
                    ) : d.condition === "clear" ? (
                      <Sun className="size-4 text-amber" />
                    ) : (
                      <Droplets className="size-4 text-muted-foreground" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs">
                      {d.rainMm >= 10
                        ? "Field work off — stay out of the mud"
                        : d.rainMm > 1
                          ? "Light rain — no spraying"
                          : d.windKph < 15
                            ? "Good spray and harvest window"
                            : "Windy — avoid spraying"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {d.tempMax}° / {d.tempMin}° · {d.rainMm} mm · {d.windKph} kph
                    </p>
                  </div>
                </div>
              ))}
            </Panel>
          </section>
        </div>
      </PageBody>
    </>
  );
}
