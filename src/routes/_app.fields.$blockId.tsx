import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ArrowLeft, Droplets, FlaskConical, ScanLine, ShieldAlert } from "lucide-react";
import { useFarm } from "@/lib/farm-store";
import { blockEconomics, formatDate, formatINR } from "@/lib/farm";
import ActionCard from "@/components/app/action-card";
import { EmptyState, Meter, PageBody, PageHeader, Panel, Pill, SectionHeading, StatTile } from "@/components/app/primitives";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/fields/$blockId")({
  head: ({ params }) => ({
    meta: [
      { title: `Block ${params.blockId.toUpperCase()} — PREDI-FARM X` },
      { name: "description", content: "Crop stage, soil, water balance, disease pressure and the reconciled task list for this field block." },
      { property: "og:title", content: `Block ${params.blockId.toUpperCase()} — PREDI-FARM X` },
      { property: "og:description", content: "Everything happening in one field block, in one place." },
    ],
  }),
  component: BlockPage,
});

function BlockPage() {
  const { blockId } = Route.useParams();
  const { blockById, cropStateFor, actionsFor, forecast } = useFarm();
  const block = blockById(blockId);
  if (!block) throw notFound();
  const state = cropStateFor(block.id);
  const econ = blockEconomics(block, state);
  const actions = actionsFor(block.id);

  const waterSeries = forecast.map((d, i) => ({
    day: d.label,
    moisture: Math.max(
      12,
      Math.min(95, block.soil.moisture + forecast.slice(0, i + 1).reduce((s, x) => s + x.rainMm * 1.1, 0) - i * 4),
    ),
  }));

  return (
    <>
      <PageHeader
        eyebrow={
          state ? `${state.crop.label} · ${state.crop.season} · day ${state.dap}` : "Fallow block"
        }
        title={`${block.name} — ${state ? state.stage.name : "ready for a new crop"}`}
        lede={state ? state.stage.focus : `${block.areaHa} ha of ${block.soilType} with nothing growing. This is the one place a crop decision is still open.`}
        actions={
          <Link
            to="/fields"
            preload="intent"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-glass-border bg-surface-1/60 px-4 text-sm font-medium hover:bg-surface-2"
          >
            <ArrowLeft className="size-4" /> All fields
          </Link>
        }
      />
      <PageBody>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Area" value={block.areaHa} unit="ha" sub={block.soilType} />
          <StatTile
            label="Soil moisture"
            value={block.soil.moisture}
            unit="%"
            sub={block.soil.moisture < 45 ? "Below the comfortable band" : "Within band"}
            icon={Droplets}
            tone={block.soil.moisture < 45 ? "warn" : "good"}
          />
          <StatTile
            label="Disease pressure"
            value={block.diseaseRisk}
            unit="%"
            sub={`Last scan ${block.lastScanDaysAgo} day${block.lastScanDaysAgo === 1 ? "" : "s"} ago`}
            icon={ShieldAlert}
            tone={block.diseaseRisk >= 55 ? "bad" : block.diseaseRisk >= 30 ? "warn" : "good"}
          />
          <StatTile
            label="Gross value"
            value={econ ? formatINR(econ.grossRevenue) : "—"}
            sub={econ ? `${econ.quintals} q at ₹${state?.crop.price}/q` : "No standing crop"}
            tone="good"
          />
        </div>

        {state && (
          <Panel className="p-5">
            <SectionHeading title="Where the crop is in its life" hint={`Sown ${state.dap} days ago · harvest around ${formatDate(state.harvestDate)}`} />
            <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {state.crop.stages.map((s, i) => {
                const done = i < state.stageIndex;
                const current = i === state.stageIndex;
                return (
                  <li
                    key={s.id}
                    className={cn(
                      "rounded-xl border p-3",
                      current
                        ? "border-primary/35 bg-primary/8"
                        : done
                          ? "border-border/60 bg-surface-2/50"
                          : "border-dashed border-border/60",
                    )}
                  >
                    <p className={cn("text-xs font-semibold", current ? "text-primary" : done ? "text-foreground" : "text-muted-foreground")}>
                      {s.name}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">day {s.from}+</p>
                  </li>
                );
              })}
            </ol>
            <Meter className="mt-4" value={state.progress * 100} />
            {state.locked && (
              <p className="mt-3 text-xs text-muted-foreground">
                This crop is past the point of switching. Advice for this block is about protecting the standing crop, not replacing it.
              </p>
            )}
          </Panel>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <section>
            <SectionHeading title="What this block needs" hint="Already reconciled against the forecast and the pre-harvest interval." />
            {actions.length ? (
              <div className="grid gap-3">
                {actions.map((a) => (
                  <ActionCard key={a.id} action={a} showBlockLink={false} />
                ))}
              </div>
            ) : (
              <EmptyState icon={ScanLine} title="Nothing pending here" body="Moisture, nutrition and disease pressure are all inside safe bands for this stage." />
            )}
          </section>

          <div className="space-y-6">
            <Panel className="p-5">
              <SectionHeading title="Water balance" hint="Projected moisture with the forecast applied" icon={Droplets} />
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={waterSeries} margin={{ left: -22, right: 6, top: 6 }}>
                    <defs>
                      <linearGradient id="moist" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-sky)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="var(--color-sky)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-surface-2)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                        fontSize: 12,
                        color: "var(--color-foreground)",
                      }}
                      formatter={(v: number) => [`${Math.round(v)}%`, "Moisture"]}
                    />
                    <Area type="monotone" dataKey="moisture" stroke="var(--color-sky)" strokeWidth={2} fill="url(#moist)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel className="p-5">
              <SectionHeading title="Soil card" hint={`pH ${block.soil.ph} · OC ${block.soil.organicCarbon}%`} icon={FlaskConical} />
              <ul className="space-y-3">
                {[
                  { l: "Nitrogen", v: block.soil.n, target: 240, unit: "kg/ha" },
                  { l: "Phosphorus", v: block.soil.p, target: 40, unit: "kg/ha" },
                  { l: "Potassium", v: block.soil.k, target: 300, unit: "kg/ha" },
                ].map((n) => {
                  const ok = n.v >= n.target * 0.85;
                  return (
                    <li key={n.l}>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="font-medium">{n.l}</span>
                        <span className="font-mono text-muted-foreground">
                          {n.v} / {n.target} {n.unit}
                        </span>
                      </div>
                      <Meter className="mt-1.5" value={(n.v / n.target) * 100} tone={ok ? "good" : "warn"} />
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill tone={block.soil.ph > 7.5 ? "warn" : "good"}>pH {block.soil.ph}</Pill>
                <Pill tone={block.soil.organicCarbon < 0.5 ? "warn" : "good"}>
                  Organic carbon {block.soil.organicCarbon}%
                </Pill>
              </div>
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  );
}
