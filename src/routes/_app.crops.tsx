import { createFileRoute } from "@tanstack/react-router";
import { Sprout } from "lucide-react";
import { useFarm } from "@/lib/farm-store";
import { CROPS, formatDate, formatINR, type CropDef, type FieldBlock } from "@/lib/farm";
import { EmptyState, PageBody, PageHeader, Panel, Pill, SectionHeading } from "@/components/app/primitives";

export const Route = createFileRoute("/_app/crops")({
  head: () => ({
    meta: [
      { title: "Crop Planner — PREDI-FARM X" },
      { name: "description", content: "Crop suggestions only for land that is actually free — standing crops are never told to switch." },
      { property: "og:title", content: "Crop Planner — PREDI-FARM X" },
      { property: "og:description", content: "Crop suggestions only for land that is actually free — standing crops are never told to switch." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

interface Ranked { crop: CropDef; score: number; netPerHa: number; reasons: string[] }

function rankCropsForBlock(b: FieldBlock): Ranked[] {
  return Object.values(CROPS).map((crop: CropDef) => {
    const netPerHa = Math.round(crop.baseYield * 10 * crop.price - crop.inputCostPerHa);
    const waterFit = b.soil.moisture >= crop.waterNeedMm / 12 ? 1 : 0.75;
    const phFit = b.soil.ph > 7.5 && crop.id === "soybean" ? 0.8 : 1;
    const score = Math.round(Math.min(98, (netPerHa / 900) * waterFit * phFit));
    return {
      crop,
      score,
      netPerHa: Math.round(netPerHa * waterFit),
      reasons: [
        `${crop.season} crop, ${crop.cycleDays} days to harvest`,
        waterFit < 1 ? "Needs more water than this block currently holds" : "Water demand matches this block",
        phFit < 1 ? `pH ${b.soil.ph} is high for this crop` : `Suits ${b.soilType.toLowerCase()}`,
      ],
    };
  }).sort((x: Ranked, y: Ranked) => y.score - x.score).slice(0, 3);
}

function Page() {
  const { blocks, cropStateFor } = useFarm();
  const free = blocks.filter((b) => !cropStateFor(b.id));
  const committed = blocks.filter((b) => cropStateFor(b.id));
  return (
    <>
      <PageHeader
        eyebrow="Crop planner"
        title="Advice only where a choice still exists"
        lede="A crop three weeks from harvest cannot be swapped. The planner only speaks about land that is free, and tells you plainly when the rest is committed."
      />
      <PageBody>
        {free.length ? (
          free.map((b) => (
            <Panel key={b.id} className="p-5">
              <SectionHeading icon={Sprout} title={`${b.name} — ${b.areaHa} ha free`} hint={`${b.soilType} · pH ${b.soil.ph} · OC ${b.soil.organicCarbon}%`} />
              <div className="grid gap-3 md:grid-cols-3">
                {rankCropsForBlock(b).map((r: Ranked, i: number) => (
                  <div key={r.crop.id} className={i === 0 ? "rounded-2xl border border-primary/35 bg-primary/8 p-4" : "rounded-2xl border border-border/60 bg-surface-2/40 p-4"}>
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-semibold">{r.crop.label}</h3>
                      <span className="font-mono text-xs text-muted-foreground">{r.score}/100</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{r.crop.season} · {r.crop.cycleDays} days</p>
                    <p className="mt-3 font-mono text-sm font-semibold text-primary">{formatINR(r.netPerHa * b.areaHa)}</p>
                    <p className="text-[11px] text-muted-foreground">projected net over the season</p>
                    <ul className="mt-3 space-y-1.5">
                      {r.reasons.map((x: string) => (
                        <li key={x} className="text-xs leading-relaxed text-muted-foreground">— {x}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Panel>
          ))
        ) : (
          <EmptyState icon={Sprout} title="Every block is committed" body="There is no free land this season, so there is no crop decision to make. Come back after harvest." />
        )}

        <Panel className="p-5">
          <SectionHeading title="Committed land" hint="Locked until harvest — shown so you know why there is no advice here." />
          <ul className="divide-y divide-border/60">
            {committed.map((b) => {
              const s = cropStateFor(b.id)!;
              return (
                <li key={b.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{b.name} · {s.crop.label}</p>
                    <p className="text-xs text-muted-foreground">{s.stage.name} · harvest {formatDate(s.harvestDate)}</p>
                  </div>
                  <Pill tone="muted">{s.daysToHarvest} days to harvest</Pill>
                </li>
              );
            })}
          </ul>
        </Panel>
      </PageBody>
    </>
  );
}
