import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useFarm } from "@/lib/farm-store";
import { Meter, PageBody, PageHeader, Panel, Pill, SectionHeading } from "@/components/app/primitives";
import { UploadAnalyzer } from "@/components/app/upload-analyzer";

export const Route = createFileRoute("/_app/disease")({
  head: () => ({
    meta: [
      { title: "Leaf Scan — PREDI-FARM X" },
      { name: "description", content: "Upload a leaf or plant photo and get an AI diagnosis with confidence, look-alikes and a safe treatment window." },
      { property: "og:title", content: "Leaf Scan — PREDI-FARM X" },
      { property: "og:description", content: "Upload a leaf or plant photo and get an AI diagnosis with confidence, look-alikes and a safe treatment window." },
    ],
  }),
  component: DiseasePage,
});

function DiseasePage() {
  const { blocks, cropStateFor } = useFarm();
  const [blockId, setBlockId] = useState(blocks[0].id);
  const block = blocks.find((b) => b.id === blockId)!;
  const state = cropStateFor(block.id);

  return (
    <>
      <PageHeader
        eyebrow="Leaf scan"
        title="A diagnosis you can argue with"
        lede="Upload photos of the affected plant. The scanner never gives a single confident answer — it ranks what the leaf could be, tells you how sure it is, and refuses to recommend a spray it cannot justify."
      />
      <PageBody>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <Panel className="p-5">
              <label className="block text-xs font-medium text-muted-foreground">
                Which block?
                <select
                  value={blockId}
                  onChange={(e) => setBlockId(e.target.value)}
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-glass-border bg-surface-2 px-3 text-sm text-foreground"
                >
                  {blocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} — {cropStateFor(b.id)?.crop.label ?? "Fallow"}
                    </option>
                  ))}
                </select>
              </label>
            </Panel>

            <UploadAnalyzer
              kind="disease"
              accept="image/*"
              title="Upload plant / leaf images"
              hint="Daylight, no shadow, one leaf filling the frame. Add 2–3 angles for a better diagnosis."
              context={`Block ${block.name}, ${state ? `${state.crop.label} at ${state.stage.name}, ${state.daysToHarvest} days to harvest, pre-harvest interval ${state.crop.phiDays} days` : "fallow"}, modelled disease pressure ${block.diseaseRisk}%`}
              contextPlaceholder="e.g. spots appeared after three days of rain, lower leaves first"
            />
          </div>

          <div className="space-y-4">
            <Panel className="p-5">
              <SectionHeading title="What the model already knows" hint="Before you photograph anything" icon={ShieldAlert} />
              <p className="text-sm leading-relaxed text-muted-foreground">
                Modelled pressure on {block.name} is <span className="font-semibold text-foreground">{block.diseaseRisk}%</span>, driven by humidity and canopy stage
                {state ? ` (${state.stage.name.toLowerCase()})` : ""}. A photo either confirms or overrides this.
              </p>
              <Meter className="mt-4" value={block.diseaseRisk} tone={block.diseaseRisk >= 55 ? "bad" : "warn"} />
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill tone="muted">Block {block.name}</Pill>
                <Pill tone={state?.withinPhi ? "bad" : "good"}>PHI {state?.crop.phiDays ?? "—"} days</Pill>
              </div>
              {state?.withinPhi && (
                <p className="mt-4 text-sm leading-relaxed text-destructive">
                  Do not spray whatever the diagnosis says. Harvest is in {state.daysToHarvest} days and the pre-harvest interval for this crop is {state.crop.phiDays} days — residue would fail testing at the mandi.
                </p>
              )}
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  );
}

