import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Loader2, ShieldAlert, TriangleAlert } from "lucide-react";
import { useFarm } from "@/lib/farm-store";
import { GhostButton, Meter, PageBody, PageHeader, Panel, Pill, PrimaryButton, SectionHeading } from "@/components/app/primitives";

export const Route = createFileRoute("/_app/disease")({
  head: () => ({
    meta: [
      { title: "Leaf Scan — PREDI-FARM X" },
      { name: "description", content: "Photograph a leaf and get a ranked diagnosis with confidence, look-alikes and a safe treatment window." },
      { property: "og:title", content: "Leaf Scan — PREDI-FARM X" },
      { property: "og:description", content: "Photograph a leaf and get a ranked diagnosis with confidence, look-alikes and a safe treatment window." },
    ],
  }),
  component: DiseasePage,
});

type Phase = "idle" | "scanning" | "result";

function DiseasePage() {
  const { blocks, cropStateFor } = useFarm();
  const [blockId, setBlockId] = useState(blocks[0].id);
  const [phase, setPhase] = useState<Phase>("idle");
  const block = blocks.find((b) => b.id === blockId)!;
  const state = cropStateFor(block.id);

  const candidates = [
    { name: state?.crop.label === "Wheat" ? "Leaf rust" : "Foliar blight", p: Math.max(38, Math.min(72, block.diseaseRisk)) },
    { name: "Nutrient scorch (not a disease)", p: 22 },
    { name: "Healthy tissue, sun damage", p: 14 },
  ];

  function scan() {
    setPhase("scanning");
    setTimeout(() => setPhase("result"), 1400);
  }

  return (
    <>
      <PageHeader
        eyebrow="Leaf scan"
        title="A diagnosis you can argue with"
        lede="The scanner never gives a single confident answer. It ranks what the leaf could be, tells you how sure it is, and refuses to recommend a spray it cannot justify."
      />
      <PageBody>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <Panel className="p-5">
            <SectionHeading title="Scan a leaf" hint="Photograph the affected leaf against a plain background." icon={Camera} />
            <label className="mb-4 block text-xs font-medium text-muted-foreground">
              Which block?
              <select
                value={blockId}
                onChange={(e) => { setBlockId(e.target.value); setPhase("idle"); }}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-glass-border bg-surface-2 px-3 text-sm text-foreground"
              >
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — {cropStateFor(b.id)?.crop.label ?? "Fallow"}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid aspect-4/3 place-items-center rounded-2xl border border-dashed border-glass-border bg-surface-2/50 text-center">
              {phase === "scanning" ? (
                <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  Comparing against 41 look-alikes
                </div>
              ) : (
                <div className="px-6">
                  <Camera className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">Add a photo of the leaf</p>
                  <p className="mt-1 text-xs text-muted-foreground">Daylight, no shadow, one leaf filling the frame.</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <PrimaryButton onClick={scan} disabled={phase === "scanning"}>
                <Camera className="size-4" /> {phase === "result" ? "Scan again" : "Run scan"}
              </PrimaryButton>
              <GhostButton onClick={() => setPhase("idle")}>Reset</GhostButton>
            </div>
          </Panel>

          <div className="space-y-4">
            {phase !== "result" ? (
              <Panel className="p-5">
                <SectionHeading title="What the model already knows" hint="Before you photograph anything" icon={ShieldAlert} />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Modelled pressure on {block.name} is <span className="font-semibold text-foreground">{block.diseaseRisk}%</span>, driven by humidity and canopy stage
                  {state ? ` (${state.stage.name.toLowerCase()})` : ""}. A photo either confirms or overrides this.
                </p>
                <Meter className="mt-4" value={block.diseaseRisk} tone={block.diseaseRisk >= 55 ? "bad" : "warn"} />
              </Panel>
            ) : (
              <>
                <Panel className="p-5">
                  <SectionHeading title="Ranked diagnosis" hint="Three possibilities, not one verdict." />
                  <ul className="space-y-4">
                    {candidates.map((c, i) => (
                      <li key={c.name}>
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <span className={i === 0 ? "font-semibold" : "text-muted-foreground"}>{c.name}</span>
                          <span className="font-mono text-xs">{c.p}%</span>
                        </div>
                        <Meter className="mt-1.5" value={c.p} tone={i === 0 ? "warn" : "info"} />
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 rounded-xl border border-amber/25 bg-amber/8 p-3 text-xs leading-relaxed text-amber">
                    <TriangleAlert className="mr-1.5 inline size-3.5" />
                    Top confidence is {candidates[0].p}%. That is not high enough to spray on its own — confirm with a second leaf from a different corner of the block.
                  </p>
                </Panel>
                <Panel className="p-5">
                  <SectionHeading title="If confirmed" hint="Treatment respects the pre-harvest interval." />
                  {state?.withinPhi ? (
                    <p className="text-sm leading-relaxed text-destructive">
                      Do not spray. Harvest is in {state.daysToHarvest} days and the pre-harvest interval for this crop is {state.crop.phiDays} days. Residue would fail testing at the mandi.
                    </p>
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Protectant fungicide at label dose across {block.areaHa} ha, applied on a dry morning with wind under 15 kph. Re-scan five days later before deciding on a second round.
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill tone="muted">Block {block.name}</Pill>
                    <Pill tone={state?.withinPhi ? "bad" : "good"}>
                      PHI {state?.crop.phiDays ?? "—"} days
                    </Pill>
                  </div>
                </Panel>
              </>
            )}
          </div>
        </div>
      </PageBody>
    </>
  );
}
