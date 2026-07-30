import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import Atmosphere from "@/components/app/atmosphere";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CROP_LIST, type CropId } from "@/lib/farm";
import { AREA_UNITS, searchPlaces, toHectares, type PlaceHit } from "@/lib/geo";
import { SOIL_TYPES, createFarm } from "@/lib/db";
import { partOfDay } from "@/lib/weather";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set up your farm — PREDI-FARM X" },
      {
        name: "description",
        content:
          "Tell PREDI-FARM X your village, farm size and crops once. Weather, stages and plans are then computed for you.",
      },
      { property: "og:title", content: "Set up your farm — PREDI-FARM X" },
      {
        property: "og:description",
        content: "Eight answers. Then every number on your dashboard is about your farm.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

const STEPS = ["You", "Village", "Land", "Crops"] as const;

interface CropPick {
  crop: CropId;
  sowingDate: string;
  share: number;
}

function Onboarding() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const [fullName, setFullName] = useState("");
  const [farmName, setFarmName] = useState("");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [place, setPlace] = useState<PlaceHit | null>(null);
  const [village, setVillage] = useState("");
  const [size, setSize] = useState("");
  const [unit, setUnit] = useState<string>("acre");
  const [soilType, setSoilType] = useState(SOIL_TYPES[0]);
  const [picks, setPicks] = useState<CropPick[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const part = partOfDay(new Date().getHours());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate({ to: "/auth", replace: true });
        return;
      }
      setUserId(data.user.id);
      supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", data.user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          if (profile?.onboarded) navigate({ to: "/dashboard", replace: true });
        });
    });
  }, [navigate]);

  // Live village lookup, debounced.
  useEffect(() => {
    if (query.trim().length < 3) {
      setHits([]);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        setHits(await searchPlaces(query, controller.signal));
      } catch {
        /* aborted or offline */
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [query]);

  const areaHa = useMemo(() => {
    const v = Number(size);
    return Number.isFinite(v) && v > 0 ? toHectares(v, unit) : 0;
  }, [size, unit]);

  const canContinue = [
    fullName.trim().length >= 2,
    !!place,
    areaHa > 0,
    true,
  ][step];

  function togglePick(crop: CropId) {
    setPicks((prev) => {
      if (prev.some((p) => p.crop === crop)) return prev.filter((p) => p.crop !== crop);
      return [
        ...prev,
        { crop, sowingDate: new Date().toISOString().slice(0, 10), share: 1 },
      ];
    });
  }

  async function finish() {
    if (!userId || !place) return;
    setBusy(true);
    setError(null);
    try {
      await createFarm({
        userId,
        fullName: fullName.trim(),
        farmName: farmName.trim(),
        state: place.state,
        district: place.district,
        village: village.trim() || place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        areaHa: Number(areaHa.toFixed(2)),
        areaUnit: unit,
        soilType,
        crops: picks,
      });
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your farm. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-svh overflow-hidden px-5 py-12">
      <Atmosphere part={part} condition="clear" windKph={8} />

      <div className="relative z-10 mx-auto w-full max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
          Step {step + 1} of {STEPS.length}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance-pretty">
          {step === 0 && "Who are we planning for?"}
          {step === 1 && "Where is your farm?"}
          {step === 2 && "How much land, in your units?"}
          {step === 3 && "What is standing in the fields?"}
        </h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          {step === 0 && "This is the only place we ask for your details. Everything else is computed."}
          {step === 1 &&
            "We pull the live forecast for these exact coordinates — rain, humidity, wind and heat."}
          {step === 2 &&
            "Work in acres, bigha or hectares. We convert once and keep every screen consistent."}
          {step === 3 &&
            "Give each crop its sowing date and we calculate the growth stage every single day."}
        </p>

        <div className="mt-6 flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>

        <div className="glass-strong mt-6 rounded-3xl p-6 grain">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              {step === 0 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Your name</Label>
                    <Input
                      id="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Arjun Rathore"
                      maxLength={80}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="farm">Farm name (optional)</Label>
                    <Input
                      id="farm"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      placeholder="e.g. Rathore Farms"
                      maxLength={80}
                    />
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="place">Nearest town or district</Label>
                    <Input
                      id="place"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPlace(null);
                      }}
                      placeholder="Start typing, e.g. Sehore"
                      maxLength={80}
                    />
                    {searching && <p className="text-xs text-muted-foreground">Searching…</p>}
                  </div>

                  {hits.length > 0 && !place && (
                    <ul className="max-h-56 space-y-1.5 overflow-y-auto">
                      {hits.map((h) => (
                        <li key={h.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setPlace(h);
                              setQuery(h.name);
                            }}
                            className="w-full rounded-xl border border-border bg-surface-1 px-3.5 py-2.5 text-left transition-colors hover:bg-surface-2"
                          >
                            <p className="text-sm font-medium">{h.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {[h.district, h.state].filter(Boolean).join(" · ")}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {place && (
                    <div className="rounded-xl border border-primary/40 bg-primary/10 px-3.5 py-3">
                      <p className="text-sm font-medium">
                        {place.name}, {place.state}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {place.latitude.toFixed(3)}, {place.longitude.toFixed(3)} — forecasts will be
                        pulled for this point
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="village">Village (optional)</Label>
                    <Input
                      id="village"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="Your village name"
                      maxLength={80}
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="size">Total farm size</Label>
                      <Input
                        id="size"
                        type="number"
                        min="0"
                        step="0.1"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        placeholder="e.g. 12"
                      />
                    </div>
                    <div className="w-44 space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <select
                        id="unit"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                      >
                        {AREA_UNITS.map((u) => (
                          <option key={u.id} value={u.id} className="bg-surface-1">
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {areaHa > 0 && (
                    <p className="text-sm text-muted-foreground">
                      That is <span className="font-semibold text-foreground">{areaHa.toFixed(2)} ha</span>.
                      All agronomy maths runs in hectares; your screens stay in {unit}.
                    </p>
                  )}
                  <div className="space-y-2">
                    <Label>Dominant soil</Label>
                    <div className="flex flex-wrap gap-2">
                      {SOIL_TYPES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSoilType(s)}
                          className={cn(
                            "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                            soilType === s
                              ? "border-primary bg-primary/15 text-foreground"
                              : "border-border text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {CROP_LIST.map((crop) => {
                      const picked = picks.find((p) => p.crop === crop.id);
                      return (
                        <div
                          key={crop.id}
                          className={cn(
                            "rounded-2xl border p-3.5 transition-colors",
                            picked ? "border-primary bg-primary/10" : "border-border bg-surface-1",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => togglePick(crop.id)}
                            className="flex w-full items-center justify-between text-left"
                          >
                            <span>
                              <span className="block text-sm font-semibold">{crop.label}</span>
                              <span className="block text-xs text-muted-foreground">
                                {crop.season} · {crop.cycleDays} day cycle
                              </span>
                            </span>
                            <span
                              className={cn(
                                "grid size-5 place-items-center rounded-full border text-[11px]",
                                picked
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border",
                              )}
                            >
                              {picked ? "✓" : ""}
                            </span>
                          </button>

                          {picked && (
                            <div className="mt-3 space-y-2">
                              <Label className="text-xs" htmlFor={`sow-${crop.id}`}>
                                Sowing date
                              </Label>
                              <Input
                                id={`sow-${crop.id}`}
                                type="date"
                                value={picked.sowingDate}
                                max={new Date().toISOString().slice(0, 10)}
                                onChange={(e) =>
                                  setPicks((prev) =>
                                    prev.map((p) =>
                                      p.crop === crop.id
                                        ? { ...p, sowingDate: e.target.value }
                                        : p,
                                    ),
                                  )
                                }
                              />
                              <Label className="text-xs" htmlFor={`share-${crop.id}`}>
                                Share of land
                              </Label>
                              <Input
                                id={`share-${crop.id}`}
                                type="number"
                                min="1"
                                step="1"
                                value={picked.share}
                                onChange={(e) =>
                                  setPicks((prev) =>
                                    prev.map((p) =>
                                      p.crop === crop.id
                                        ? { ...p, share: Math.max(1, Number(e.target.value) || 1) }
                                        : p,
                                    ),
                                  )
                                }
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    No crop selected? We create one fallow block and suggest what to sow next.
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || busy}
            >
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
                Continue
              </Button>
            ) : (
              <Button onClick={finish} disabled={busy}>
                {busy ? "Building your farm…" : "Open my dashboard"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
