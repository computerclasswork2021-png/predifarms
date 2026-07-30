import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useFarm } from "@/lib/farm-store";
import { blockEconomics, formatINR } from "@/lib/farm";
import { PageBody, PageHeader, Panel, SectionHeading, StatTile } from "@/components/app/primitives";

export const Route = createFileRoute("/_app/simulator")({
  head: () => ({
    meta: [
      { title: "What-if Simulator — PREDI-FARM X" },
      { name: "description", content: "Change irrigation, nutrition and price assumptions and watch the projected yield and margin move in real time." },
      { property: "og:title", content: "What-if Simulator — PREDI-FARM X" },
      { property: "og:description", content: "Change irrigation, nutrition and price assumptions and watch the projected yield and margin move in real time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { blocks, cropStateFor } = useFarm();
  const [blockId, setBlockId] = useState(blocks[0].id);
  const [irrigation, setIrrigation] = useState(100);
  const [nutrition, setNutrition] = useState(100);
  const [price, setPrice] = useState(100);
  const block = blocks.find((b) => b.id === blockId)!;
  const state = cropStateFor(block.id);
  const base = blockEconomics(block, state);

  const factor = (0.55 + 0.25 * (irrigation / 100) + 0.2 * (nutrition / 100)) * (state ? 1 : 0);
  const yieldPerHa = base ? +(base.yieldPerHa * (0.7 + factor * 0.42)).toFixed(2) : 0;
  const quintals = Math.round(yieldPerHa * block.areaHa * 10);
  const rate = state ? Math.round(state.crop.price * (price / 100)) : 0;
  const gross = quintals * rate;
  const cost = base ? Math.round(base.inputCost * (0.75 + 0.15 * (irrigation / 100) + 0.2 * (nutrition / 100))) : 0;
  const net = gross - cost;
  const delta = base ? net - base.netProfit : 0;

  return (
    <>
      <PageHeader
        eyebrow="Decision sandbox"
        title="Test the decision before you spend the money"
        lede="Yield is modelled in tonnes per hectare and priced per quintal, the way it is actually traded. Move a slider and every number below updates."
      />
      <PageBody>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <Panel className="p-5">
            <SectionHeading icon={SlidersHorizontal} title="Assumptions" hint="Relative to your current plan (100% = unchanged)" />
            <label className="mb-5 block text-xs font-medium text-muted-foreground">
              Block
              <select
                value={blockId}
                onChange={(e) => setBlockId(e.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-glass-border bg-surface-2 px-3 text-sm text-foreground"
              >
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} — {cropStateFor(b.id)?.crop.label ?? "Fallow"}</option>
                ))}
              </select>
            </label>
            {([["Irrigation", irrigation, setIrrigation], ["Nutrition", nutrition, setNutrition], ["Sale price", price, setPrice]] as const).map(([label, val, set]) => (
              <div key={label} className="mb-5">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-medium">{label}</span>
                  <span className="font-mono text-muted-foreground">{val}%</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={140}
                  step={5}
                  value={val}
                  onChange={(e) => set(Number(e.target.value))}
                  aria-label={label}
                  className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-3 accent-primary"
                />
              </div>
            ))}
          </Panel>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Projected yield" value={yieldPerHa} unit="t/ha" sub={`${quintals} quintals total`} />
              <StatTile label="Sale rate" value={`₹${rate}`} sub="per quintal" />
              <StatTile label="Season cost" value={formatINR(cost)} sub={`${block.areaHa} ha`} />
              <StatTile label="Net margin" value={formatINR(net)} sub={delta >= 0 ? `+${formatINR(delta)} vs current plan` : `${formatINR(delta)} vs current plan`} tone={delta >= 0 ? "good" : "bad"} />
            </div>
            <Panel className="p-5">
              <SectionHeading title="What this actually means" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                {!state
                  ? "This block is fallow, so there is nothing to simulate. Pick a block with a standing crop."
                  : delta >= 0
                    ? `Spending ${formatINR(Math.max(0, cost - (base?.inputCost ?? 0)))} more returns ${formatINR(delta)}. That holds only if the crop stays healthy through ${state.stage.name.toLowerCase()}.`
                    : `This combination loses ${formatINR(Math.abs(delta))} against your current plan. The extra input cost is not recovered at ₹${rate}/q.`}
              </p>
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  );
}
