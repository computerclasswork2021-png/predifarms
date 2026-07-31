import { createFileRoute } from "@tanstack/react-router";
import { Languages, Palette, Ruler, Tractor } from "lucide-react";
import { useFarm } from "@/lib/farm-store";
import { usePrefs } from "@/lib/i18n";
import { PageBody, PageHeader, Panel, Pill, SectionHeading } from "@/components/app/primitives";
import {
  FontSizeSwitch,
  LanguageSwitch,
  ThemeSwitch,
} from "@/components/app/preference-controls";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — PREDI-FARM X" },
      {
        name: "description",
        content:
          "Choose light or dark mode, switch the app between English and Hindi, and set a text size you can read comfortably.",
      },
      { property: "og:title", content: "Settings — PREDI-FARM X" },
      {
        property: "og:description",
        content: "Theme, language, text size, farm details and trading units — all in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { farm } = useFarm();
  const { t } = usePrefs();

  return (
    <>
      <PageHeader
        eyebrow={t("Settings")}
        title={t("Your farm, your units, your language")}
        lede={t("These settings shape every number and every piece of advice in the app.")}
      />
      <PageBody>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="p-5 lg:col-span-2">
            <SectionHeading
              icon={Palette}
              title={t("Appearance and language")}
              hint={t("Everything here is saved on this device and applies to the whole app.")}
            />
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {t("Theme")}
                </p>
                <ThemeSwitch />
              </div>
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <Languages className="size-3.5" aria-hidden />
                  {t("Language")}
                </p>
                <LanguageSwitch />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {t("Text size")}
                </p>
                <FontSizeSwitch />
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("Make every word in the app bigger or smaller.")}
                </p>
              </div>
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeading icon={Tractor} title={t("Farm")} />
            <dl className="space-y-3 text-sm">
              {(
                [
                  [t("Name"), farm.name],
                  [t("Farmer"), farm.farmer],
                  [t("Village"), farm.village],
                  [t("Total area"), `${farm.areaHa} ha`],
                ] as const
              ).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-2"
                >
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel className="p-5">
            <SectionHeading
              icon={Ruler}
              title={t("Units")}
              hint="Chosen to match how the mandi actually trades."
            />
            <div className="flex flex-wrap gap-2">
              <Pill tone="good">{t("Yield in t/ha")}</Pill>
              <Pill tone="good">{t("Price in ₹/quintal")}</Pill>
              <Pill tone="good">{t("Area in hectares")}</Pill>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              One tonne is ten quintals. The app converts between them everywhere so a yield figure
              and a price figure never get multiplied wrongly.
            </p>
          </Panel>
        </div>
      </PageBody>
    </>
  );
}
