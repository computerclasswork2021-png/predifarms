import { createFileRoute } from "@tanstack/react-router";
import { useFarm } from "@/lib/farm-store";
import { PageBody, PageHeader, Panel, Pill, SectionHeading } from "@/components/app/primitives";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — PREDI-FARM X" },
      { name: "description", content: "Farm details, units, language and alert preferences." },
      { property: "og:title", content: "Settings — PREDI-FARM X" },
      { property: "og:description", content: "Farm details, units, language and alert preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { farm } = useFarm();
  return (
    <>
      <PageHeader eyebrow="Settings" title="Your farm, your units, your language" lede="These settings shape every number and every piece of advice in the app." />
      <PageBody>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="p-5">
            <SectionHeading title="Farm" />
            <dl className="space-y-3 text-sm">
              {[["Name", farm.name], ["Farmer", farm.farmer], ["Village", farm.village], ["Total area", `${farm.areaHa} ha`]].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <Panel className="p-5">
            <SectionHeading title="Units and language" hint="Chosen to match how the mandi actually trades." />
            <div className="flex flex-wrap gap-2">
              <Pill tone="good">Yield in t/ha</Pill>
              <Pill tone="good">Price in ₹/quintal</Pill>
              <Pill tone="good">Area in hectares</Pill>
              <Pill tone="muted">English (Hindi coming)</Pill>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              One tonne is ten quintals. The app converts between them everywhere so a yield figure and a price figure never get multiplied wrongly.
            </p>
          </Panel>
        </div>
      </PageBody>
    </>
  );
}
