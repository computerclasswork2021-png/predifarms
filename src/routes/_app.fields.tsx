import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Sprout, ArrowUpRight, Plus, MapPin, Droplets, Pencil } from "lucide-react";
import { motion } from "motion/react";
import { useFarm } from "@/lib/farm-store";
import { blockEconomics, formatDate, formatINR } from "@/lib/farm";
import { AERIAL_FIELDS, AERIAL_PATCHWORK, cropPhoto } from "@/lib/photography";
import {
  Meter,
  PageBody,
  PhotoCard,
  PhotoHero,
  Pill,
  Reveal,
  SectionHeading,
} from "@/components/app/primitives";
import BlockEditor from "@/components/app/block-editor";

export const Route = createFileRoute("/_app/fields")({
  head: () => ({
    meta: [
      { title: "My Fields — PREDI-FARM X" },
      {
        name: "description",
        content:
          "Every field block with its real crop stage, health, water status and harvest date.",
      },
      { property: "og:title", content: "My Fields — PREDI-FARM X" },
      {
        property: "og:description",
        content: "Block-by-block crop stage, health and harvest timing.",
      },
    ],
  }),
  component: FieldsPage,
});

function FieldsPage() {
  const { blocks, farm, cropStateFor, openPlan } = useFarm();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  function openAdd() {
    setEditId(null);
    setEditorOpen(true);
  }
  function openEdit(id: string) {
    setEditId(id);
    setEditorOpen(true);
  }

  return (
    <>
      <PhotoHero
        photo={AERIAL_FIELDS}
        eyebrow="Field register"
        title="Your land, block by block"
        lede={`${farm.areaHa} hectares across ${blocks.length} block${blocks.length === 1 ? "" : "s"}. Each block has its own crop, its own stage and its own plan — nothing here is a farm-wide average.`}
        actions={
          <button
            onClick={openAdd}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[0_18px_46px_-18px_oklch(0.75_0.17_155/0.95)]"
          >
            <Plus className="size-4" /> Add a block
          </button>
        }
      />

      <PageBody>
        <SectionHeading
          title="All blocks"
          hint="Tap a block to walk into it. Use the pencil to rename, re-crop or retire a block."
        />

        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {blocks.map((b, i) => {
            const state = cropStateFor(b.id);
            const econ = blockEconomics(b, state);
            const tasks = openPlan.filter((a) => a.blockId === b.id).length;
            const photo = b.photoUrl
              ? { url: b.photoUrl, alt: b.name, position: "center" }
              : cropPhoto(b.crop);
            return (
              <Reveal key={b.id} delay={i * 0.05}>
                <PhotoCard
                  photo={photo}
                  className="h-full"
                  imageClassName="h-44"
                  badge={
                    tasks > 0 ? (
                      <Pill tone="warn">{tasks} open</Pill>
                    ) : (
                      <Pill tone="good">Clear</Pill>
                    )
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold">{b.name}</h3>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {b.areaHa} ha · {b.soilType} · {state ? state.crop.label : "Fallow"}
                      </p>
                    </div>
                    <button
                      onClick={() => openEdit(b.id)}
                      aria-label={`Edit ${b.name}`}
                      className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <Pill tone="muted">
                      <Droplets className="size-3" /> {b.irrigationMethod}
                    </Pill>
                    <Pill tone="muted">
                      <MapPin className="size-3" /> {farm.village}
                    </Pill>
                  </div>

                  {state ? (
                    <>
                      <div className="mt-4 flex items-baseline justify-between text-sm">
                        <span className="font-medium text-primary">{state.stage.name}</span>
                        <span className="text-xs text-muted-foreground">
                          day {state.dap} of {state.crop.cycleDays}
                        </span>
                      </div>
                      <Meter
                        className="mt-2"
                        value={state.progress * 100}
                        tone={state.daysToHarvest < 10 ? "warn" : "good"}
                      />
                      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border/60 pt-4">
                        <div>
                          <dt className="text-[11px] text-muted-foreground">Forecast yield</dt>
                          <dd className="font-mono text-sm font-semibold">
                            {econ?.yieldPerHa} t/ha
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[11px] text-muted-foreground">Gross value</dt>
                          <dd className="font-mono text-sm font-semibold">
                            {econ ? formatINR(econ.grossRevenue) : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[11px] text-muted-foreground">Harvest</dt>
                          <dd className="font-mono text-sm font-semibold">
                            {formatDate(state.harvestDate)}
                          </dd>
                        </div>
                      </dl>
                    </>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-amber/30 bg-amber/5 p-4">
                      <p className="flex items-center gap-2 text-sm font-medium text-amber">
                        <Sprout className="size-4" /> Fallow — {b.areaHa} ha available
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        This is the only block where a crop choice is still open.
                      </p>
                    </div>
                  )}

                  <Link
                    to="/fields/$blockId"
                    params={{ blockId: b.id }}
                    preload="intent"
                    className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Open block <ArrowUpRight className="size-3" />
                  </Link>
                </PhotoCard>
              </Reveal>
            );
          })}

          {/* Add-block tile */}
          <Reveal delay={blocks.length * 0.05}>
            <button
              onClick={openAdd}
              className="group grid h-full min-h-[20rem] w-full place-items-center rounded-3xl border-2 border-dashed border-border/70 bg-surface-1/30 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-surface-1/50 hover:text-primary"
            >
              <div className="text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 ring-1 ring-primary/20 transition-transform duration-300 group-hover:scale-110">
                  <Plus className="size-5" />
                </span>
                <p className="mt-4 text-sm font-semibold">Add another block</p>
                <p className="mt-1 max-w-[14rem] text-xs leading-relaxed">
                  Name it, assign a crop, set the sowing date and irrigation method.
                </p>
              </div>
            </button>
          </Reveal>
        </div>
      </PageBody>

      <BlockEditor open={editorOpen} onClose={() => setEditorOpen(false)} blockId={editId} />
    </>
  );
}
