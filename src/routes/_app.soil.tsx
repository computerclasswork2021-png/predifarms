import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { useFarm } from "@/lib/farm-store";
import {
  Meter,
  PageBody,
  PageHeader,
  Panel,
  PhotoCard,
  PhotoHero,
  Pill,
  Reveal,
  SectionHeading,
} from "@/components/app/primitives";
import { UploadAnalyzer } from "@/components/app/upload-analyzer";
import { SOIL_HANDS, SOIL_SEEDLINGS } from "@/lib/photography";

export const Route = createFileRoute("/_app/soil")({
  head: () => ({
    meta: [
      { title: "Soil — PREDI-FARM X" },
      {
        name: "description",
        content:
          "NPK, pH, organic carbon and moisture for every block, each read against the crop actually growing there.",
      },
      { property: "og:title", content: "Soil — PREDI-FARM X" },
      {
        property: "og:description",
        content:
          "NPK, pH, organic carbon and moisture for every block, each read against the crop actually growing there.",
      },
    ],
  }),
  component: SoilPage,
});

const TARGETS = { n: 240, p: 40, k: 300 };

function SoilPage() {
  const { blocks, cropStateFor } = useFarm();
  return (
    <>
      <PhotoHero
        photo={SOIL_HANDS}
        eyebrow="Soil intelligence"
        title="Soil read against the crop that is actually in the ground"
        lede="The same nitrogen number means different things at tillering and at ripening. Every reading below is judged against the stage of the crop standing on that block."
      />

      <PageBody>
        <div className="mb-6">
          <UploadAnalyzer
            kind="soil"
            accept="image/*,.pdf,.csv,.txt"
            title="Upload a soil health report"
            hint="Photo, scan or PDF of your soil health card or lab sheet — the AI reads the values and interprets them."
            contextPlaceholder="e.g. Wheat sown 20 days ago on Block A, canal irrigated"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {blocks.map((b, i) => {
            const state = cropStateFor(b.id);
            return (
              <Reveal key={b.id} delay={i * 0.05}>
                <Panel className="h-full p-5">
                  <SectionHeading
                    icon={FlaskConical}
                    title={b.name}
                    hint={
                      state
                        ? `${state.crop.label} · ${state.stage.name}`
                        : "Fallow · reading is a baseline for the next crop"
                    }
                  />
                  <ul className="space-y-3">
                    {(
                      [
                        ["Nitrogen", b.soil.n, TARGETS.n],
                        ["Phosphorus", b.soil.p, TARGETS.p],
                        ["Potassium", b.soil.k, TARGETS.k],
                      ] as const
                    ).map(([label, v, target]) => (
                      <li key={label}>
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="font-medium">{label}</span>
                          <span className="font-mono text-muted-foreground">
                            {v} / {target} kg/ha
                          </span>
                        </div>
                        <Meter
                          className="mt-1.5"
                          value={(v / target) * 100}
                          tone={v >= target * 0.85 ? "good" : "warn"}
                        />
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Pill tone={b.soil.ph > 7.5 || b.soil.ph < 6 ? "warn" : "good"}>
                      pH {b.soil.ph}
                    </Pill>
                    <Pill tone={b.soil.moisture < 45 ? "warn" : "good"}>
                      Moisture {b.soil.moisture}%
                    </Pill>
                    <Pill tone={b.soil.organicCarbon < 0.5 ? "warn" : "good"}>
                      OC {b.soil.organicCarbon}%
                    </Pill>
                  </div>
                  <p className="mt-4 border-t border-border/60 pt-3 text-xs leading-relaxed text-muted-foreground">
                    {state
                      ? state.inNutrientWindow
                        ? `${state.crop.label} is in its ${state.stage.name.toLowerCase()} nutrient window — a top-dress here still changes the yield.`
                        : `No nutrient window is open at ${state.stage.name.toLowerCase()}. Applying more now mostly runs off. Record the gap and correct it before the next sowing.`
                      : "Correct phosphorus and organic carbon before sowing — it is far cheaper than fixing it mid-season."}
                  </p>
                </Panel>
              </Reveal>
            );
          })}
        </div>
      </PageBody>
    </>
  );
}
