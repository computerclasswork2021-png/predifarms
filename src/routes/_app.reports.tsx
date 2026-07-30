import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, FileBarChart2 } from "lucide-react";
import { useFarm } from "@/lib/farm-store";
import { formatINR } from "@/lib/farm";
import { EmptyState, PageBody, PageHeader, Panel, Pill, SectionHeading, StatTile } from "@/components/app/primitives";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({
    meta: [
      { title: "Records — PREDI-FARM X" },
      { name: "description", content: "A season log of everything done on the farm, block by block, with the cost attached." },
      { property: "og:title", content: "Records — PREDI-FARM X" },
      { property: "og:description", content: "A season log of everything done on the farm, block by block, with the cost attached." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { blocks, cropStateFor, plan, isDone } = useFarm();
  const done = plan.filter((a) => isDone(a.id));
  return (
    <>
      <PageHeader
        eyebrow="Season log"
        title="What was done, where, and what it cost"
        lede="Records are only useful if they are a by-product of the work. Every task you tick off on the action plan lands here automatically."
      />
      <PageBody>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Tasks completed" value={done.length} sub="This season" icon={CheckCircle2} tone="good" />
          <StatTile label="Still open" value={plan.length - done.length} sub="Across all blocks" tone={plan.length - done.length ? "warn" : "good"} />
          <StatTile label="Blocks under crop" value={blocks.filter((b) => cropStateFor(b.id)).length} sub={`of ${blocks.length}`} />
          <StatTile label="Value protected" value={formatINR(done.reduce((s, a) => s + (a.impact ?? 0), 0))} sub="Rupees at stake on completed tasks" />
        </div>
        <Panel className="p-5">
          <SectionHeading title="Completed work" hint="Newest first" icon={FileBarChart2} />
          {done.length ? (
            <ul className="divide-y divide-border/60">
              {done.slice().reverse().map((a) => (
                <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{blocks.find((b) => b.id === a.blockId)?.name ?? "Farm-wide"} · {a.because}</p>
                  </div>
                  <Pill tone="good">{a.impact ? formatINR(a.impact) : "Logged"}</Pill>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={FileBarChart2} title="Nothing logged yet" body="Tick a task off on the action plan and it will appear here with its cost." />
          )}
        </Panel>
      </PageBody>
    </>
  );
}
