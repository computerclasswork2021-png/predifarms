import { createFileRoute } from "@tanstack/react-router";
import { CloudRain, Sun, Wind } from "lucide-react";
import { useFarm } from "@/lib/farm-store";
import { nextSprayWindow, rainWithin } from "@/lib/farm";
import {
  PageBody,
  Panel,
  PhotoHero,
  Pill,
  SectionHeading,
  StatTile,
} from "@/components/app/primitives";
import { STORM_FIELD } from "@/lib/photography";

export const Route = createFileRoute("/_app/weather")({
  head: () => ({
    meta: [
      { title: "Weather — PREDI-FARM X" },
      {
        name: "description",
        content:
          "Seven days of weather translated into field operations: spray windows, irrigation holds and harvest risk.",
      },
      { property: "og:title", content: "Weather — PREDI-FARM X" },
      {
        property: "og:description",
        content:
          "Seven days of weather translated into field operations: spray windows, irrigation holds and harvest risk.",
      },
    ],
  }),
  component: WeatherPage,
});

function WeatherPage() {
  const { forecast } = useFarm();
  const spray = nextSprayWindow(forecast);
  const rain7 = rainWithin(forecast, 7);
  return (
    <>
      <PhotoHero
        photo={STORM_FIELD}
        eyebrow="Weather intelligence"
        title="Seven days, written as field operations"
        lede="A forecast only matters if it changes what you do. Every day below says whether you can spray, irrigate or take the harvester out."
      />

      <PageBody>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Rain this week"
            value={Math.round(rain7)}
            unit="mm"
            sub="Total across 7 days"
            icon={CloudRain}
            tone={rain7 > 30 ? "warn" : "good"}
          />
          <StatTile
            label="Next spray window"
            value={spray ? spray.label : "None"}
            sub={
              spray
                ? `${spray.windKph} kph wind, ${spray.rainMm} mm rain`
                : "No dry, low-wind day in 7 days"
            }
            icon={Wind}
            tone={spray ? "good" : "bad"}
          />
          <StatTile
            label="Wettest day"
            value={Math.max(...forecast.map((d) => d.rainMm))}
            unit="mm"
            sub="Keep machinery off the field"
            icon={CloudRain}
            tone="warn"
          />
          <StatTile
            label="Peak heat"
            value={Math.max(...forecast.map((d) => d.tempMax))}
            unit="°C"
            sub="Irrigate before 10 am on these days"
            icon={Sun}
            tone="default"
          />
        </div>

        <Panel className="p-5">
          <SectionHeading title="Day by day" hint="The verdict comes first, the numbers second." />
          <ul className="divide-y divide-border/60">
            {forecast.map((d) => {
              const verdict =
                d.rainMm >= 10
                  ? { text: "Stay off the field — heavy rain", tone: "bad" as const }
                  : d.rainMm > 1
                    ? { text: "No spraying — it will wash off", tone: "warn" as const }
                    : d.windKph >= 15
                      ? { text: "Too windy to spray, fine to irrigate", tone: "warn" as const }
                      : { text: "Good day for spraying and harvest", tone: "good" as const };
              return (
                <li
                  key={d.offset}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{d.label}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {d.tempMax}° / {d.tempMin}° · {d.rainMm} mm · {d.rainChance}% chance ·{" "}
                      {d.windKph} kph · {d.humidity}% RH
                    </p>
                  </div>
                  <Pill tone={verdict.tone}>{verdict.text}</Pill>
                </li>
              );
            })}
          </ul>
        </Panel>
      </PageBody>
    </>
  );
}
