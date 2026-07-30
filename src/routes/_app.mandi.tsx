import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { useFarm } from "@/lib/farm-store";
import { blockEconomics, formatINR } from "@/lib/farm";

import { PageBody, PageHeader, Panel, SectionHeading, StatTile } from "@/components/app/primitives";

const MSP: Record<string, number> = { wheat: 2425, rice: 2300, soybean: 4892, maize: 2225 };

export const Route = createFileRoute("/_app/mandi")({
  head: () => ({
    meta: [
      { title: "Mandi Prices — PREDI-FARM X" },
      { name: "description", content: "Local mandi rates against MSP, with a plain answer on whether to sell now or hold." },
      { property: "og:title", content: "Mandi Prices — PREDI-FARM X" },
      { property: "og:description", content: "Local mandi rates against MSP, with a plain answer on whether to sell now or hold." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { blocks, cropStateFor } = useFarm();
  const standing = blocks.map((b) => ({ b, s: cropStateFor(b.id) })).filter((x) => x.s);
  return (
    <>
      <PageHeader
        eyebrow="Market"
        title="Sell now, or hold?"
        lede="Rates on their own are trivia. Each row below is tied to a block of yours and ends with a decision you can act on."
      />
      <PageBody>
        <div className="grid gap-4 lg:grid-cols-2">
          {standing.map(({ b, s }) => {
            const crop = s!.crop;
            const msp = MSP[crop.id] ?? Math.round(crop.price * 0.95);
            const aboveMsp = crop.price >= msp;
            const econ = blockEconomics(b, s);
            return (
              <Panel key={b.id} className="p-5">
                <SectionHeading icon={TrendingUp} title={`${crop.label} — ${b.name}`} hint={`Harvest in ${s!.daysToHarvest} days`} />
                <div className="grid grid-cols-3 gap-3">
                  <StatTile label="Mandi rate" value={`₹${crop.price}`} sub="per quintal" />
                  <StatTile label="MSP" value={`₹${msp}`} sub="per quintal" tone={aboveMsp ? "good" : "warn"} />
                  <StatTile label="Your lot" value={econ ? `${econ.quintals} q` : "—"} sub={econ ? formatINR(econ.grossRevenue) : ""} />
                </div>
                <p className="mt-4 rounded-xl border border-border/60 bg-surface-2/50 p-3 text-xs leading-relaxed text-muted-foreground">
                  {aboveMsp
                    ? `Market is ₹${crop.price - msp}/q above MSP. With ${s!.daysToHarvest} days to harvest, book roughly half the lot forward and keep the rest for spot.`
                    : `Market is ₹${msp - crop.price}/q below MSP. Sell through the procurement centre rather than the open mandi — the difference on your lot is about ${formatINR((msp - crop.price) * (econ?.quintals ?? 0))}.`}
                </p>
              </Panel>
            );
          })}
        </div>
      </PageBody>
    </>
  );
}
