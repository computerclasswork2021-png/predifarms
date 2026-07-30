import { createFileRoute, Link } from "@tanstack/react-router";
import { Sprout, ArrowUpRight } from "lucide-react";
import { useFarm } from "@/lib/farm-store";
import { blockEconomics, formatDate, formatINR } from "@/lib/farm";
import { Meter, PageBody, PageHeader, Panel, Pill, Reveal } from "@/components/app/primitives";

export const Route = createFileRoute("/_app/fields")({
  head: () => ({
    meta: [
      { title: "My Fields — PREDI-FARM X" },
      { name: "description", content: "Every field block with its real crop stage, health, water status and harvest date." },
      { property: "og:title", content: "My Fields — PREDI-FARM X" },
      { property: "og:description", content: "Block-by-block crop stage, health and harvest timing." },
    ],
  }),
  component: FieldsPage,
});

function FieldsPage() {
  const { blocks, farm, cropStateFor, openPlan } = useFarm();
  return (
    <>
      <PageHeader
        eyebrow="Field register"
        title="Your land, block by block"
        lede={`${farm.areaHa} hectares in ${blocks.length} blocks. Each block has its own crop, its own stage and its own plan — nothing here is a farm-wide average.`}
      />
      <PageBody>
        <div className="grid gap-4 lg:grid-cols-2">
          {blocks.map((b, i) => {
            const state = cropStateFor(b.id);
            const econ = blockEconomics(b, state);
            const tasks = openPlan.filter((a) => a.blockId === b.id);
            return (
              <Reveal key={b.id} delay={i * 0.04}>
                <Link to="/fields/$blockId" params={{ blockId: b.id }} preload="intent">
                  <Panel interactive className="h-full p-5">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold">{b.name}</h2>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {b.areaHa} ha · {b.soilType} · {state ? state.crop.label : "Fallow"}
                        </p>
                      </div>
                      <Pill tone={tasks.length ? "warn" : "good"}>
                        {tasks.length ? `${tasks.length} open` : "Clear"}
                      </Pill>
                    </div>

                    {state ? (
                      <>
                        <div className="mt-5 flex items-baseline justify-between text-sm">
                          <span className="font-medium text-primary">{state.stage.name}</span>
                          <span className="text-xs text-muted-foreground">
                            day {state.dap} of {state.crop.cycleDays}
                          </span>
                        </div>
                        <Meter className="mt-2" value={state.progress * 100} />
                        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{state.stage.focus}</p>
                        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border/60 pt-4">
                          <div>
                            <dt className="text-[11px] text-muted-foreground">Forecast yield</dt>
                            <dd className="font-mono text-sm font-semibold">{econ?.yieldPerHa} t/ha</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-muted-foreground">Gross value</dt>
                            <dd className="font-mono text-sm font-semibold">{econ ? formatINR(econ.grossRevenue) : "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-muted-foreground">Harvest</dt>
                            <dd className="font-mono text-sm font-semibold">{formatDate(state.harvestDate)}</dd>
                          </div>
                        </dl>
                      </>
                    ) : (
                      <div className="mt-5 rounded-xl border border-dashed border-amber/30 bg-amber/5 p-4">
                        <p className="flex items-center gap-2 text-sm font-medium text-amber">
                          <Sprout className="size-4" /> Fallow — {b.areaHa} ha available
                        </p>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          This is the only block where a crop choice is still open. Everything else is committed.
                        </p>
                      </div>
                    )}
                    <p className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary">
                      Open block <ArrowUpRight className="size-3" />
                    </p>
                  </Panel>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </PageBody>
    </>
  );
}
