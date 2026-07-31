import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  buildActions,
  buildFarmPlan,
  getCropState,
  type CropId,
  type FarmAction,
  type FieldBlock,
  type WeatherDay,
} from "./farm";
import {
  createBlock as createBlockRow,
  deleteBlock as deleteBlockRow,
  fetchBlocks,
  fetchCompletions,
  fetchProfile,
  fetchTasks,
  toFieldBlock,
  type BlockRow,
  type Profile,
  type TaskRow,
} from "./db";
import {
  diseasePressure,
  fetchWeather,
  greetingFor,
  partOfDay,
  seasonFor,
  sprayWindowFrom,
  type CurrentWeather,
  type LiveWeather,
  type PartOfDay,
} from "./weather";

export interface FarmSummary {
  name: string;
  farmer: string;
  village: string;
  areaHa: number;
  state: string;
  district: string;
  areaUnit: string;
  latitude: number;
  longitude: number;
}

export interface NewTask {
  title: string;
  detail?: string;
  kind?: string;
  dueDate?: string | null;
  blockId?: string | null;
}

export interface NewBlock {
  name: string;
  areaHa: number;
  soilType: string;
  crop: string | null;
  sowingDate: string | null;
  irrigationMethod: string;
  photoUrl?: string | null;
}

interface FarmContextValue {
  today: Date;
  userId: string;
  profile: Profile;
  farm: FarmSummary;
  blocks: FieldBlock[];
  blockRows: BlockRow[];
  forecast: WeatherDay[];
  current: CurrentWeather;
  weatherStale: boolean;
  partOfDay: PartOfDay;
  greeting: string;
  season: string;
  sprayWindow: ReturnType<typeof sprayWindowFrom>;
  plan: FarmAction[];
  openPlan: FarmAction[];
  completed: string[];
  isDone: (id: string) => boolean;
  toggleDone: (id: string) => void;
  actionsFor: (blockId: string) => FarmAction[];
  cropStateFor: (blockId: string) => ReturnType<typeof getCropState>;
  blockById: (id: string) => FieldBlock | undefined;
  tasks: TaskRow[];
  addTask: (task: NewTask) => Promise<void>;
  toggleTask: (id: string, done: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addBlock: (block: NewBlock) => Promise<void>;
  updateBlock: (id: string, patch: Partial<BlockRow>) => Promise<void>;
  removeBlock: (id: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const FarmContext = createContext<FarmContextValue | null>(null);

function LoadingFarm({ label }: { label: string }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background">
      <div className="relative h-14 w-14">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/25" />
        <span className="absolute inset-2 rounded-full bg-primary/70" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function FarmProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const qc = useQueryClient();
  const [today, setToday] = useState(() => new Date());

  // Keep the clock honest — time-aware theming and DAP maths depend on it.
  useEffect(() => {
    const t = setInterval(() => setToday(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => fetchProfile(userId),
  });
  const blocksQuery = useQuery({
    queryKey: ["blocks", userId],
    queryFn: () => fetchBlocks(userId),
  });
  const tasksQuery = useQuery({
    queryKey: ["tasks", userId],
    queryFn: () => fetchTasks(userId),
  });
  const completionsQuery = useQuery({
    queryKey: ["completions", userId],
    queryFn: () => fetchCompletions(userId),
  });

  const lat = profileQuery.data?.latitude ?? null;
  const lon = profileQuery.data?.longitude ?? null;

  const weatherQuery = useQuery<LiveWeather>({
    queryKey: ["weather", lat, lon],
    queryFn: () => fetchWeather(lat as number, lon as number),
    enabled: lat != null && lon != null,
    staleTime: 10 * 60_000,
    refetchInterval: 15 * 60_000,
  });

  const invalidate = useCallback(
    (key: string) => qc.invalidateQueries({ queryKey: [key, userId] }),
    [qc, userId],
  );

  const toggleCompletion = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      if (done) {
        const { error } = await supabase
          .from("action_completions")
          .delete()
          .eq("user_id", userId)
          .eq("action_id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("action_completions")
          .upsert({ user_id: userId, action_id: id }, { onConflict: "user_id,action_id" });
        if (error) throw error;
      }
    },
    onSuccess: () => invalidate("completions"),
  });

  const profile = profileQuery.data;
  const weather = weatherQuery.data;

  const value = useMemo<FarmContextValue | null>(() => {
    if (!profile || !weather) return null;

    const forecast = weather.forecast;
    const pressure = diseasePressure(forecast);
    const rows = blocksQuery.data ?? [];
    const blocks = rows.map((row) => {
      const block = toFieldBlock(row, today);
      if (!block.crop) return block;
      // Disease pressure is weather-driven, tempered by the block's own vigour.
      const derived = Math.round(pressure * (1 - block.health / 320));
      return { ...block, diseaseRisk: Math.max(block.diseaseRisk > 0 ? 4 : 0, derived) };
    });

    const plan = buildFarmPlan(blocks, forecast, today);
    const completed = completionsQuery.data ?? [];
    const done = new Set(completed);
    const part = partOfDay(today.getHours());

    return {
      today,
      userId,
      profile,
      farm: {
        name: profile.farm_name ?? "My farm",
        farmer: profile.full_name || "Farmer",
        village: [profile.village, profile.state].filter(Boolean).join(", ") || "My village",
        areaHa: blocks.reduce((s, b) => s + b.areaHa, 0) || Number(profile.farm_size ?? 0),
        state: profile.state ?? "",
        district: profile.district ?? "",
        areaUnit: profile.area_unit,
        latitude: profile.latitude ?? 0,
        longitude: profile.longitude ?? 0,
      },
      blocks,
      blockRows: rows,
      forecast,
      current: weather.current,
      weatherStale: weatherQuery.isStale,
      partOfDay: part,
      greeting: greetingFor(part),
      season: seasonFor(today.getMonth() + 1),
      sprayWindow: sprayWindowFrom(forecast),
      plan,
      openPlan: plan.filter((a) => !done.has(a.id)),
      completed,
      isDone: (id) => done.has(id),
      toggleDone: (id) => toggleCompletion.mutate({ id, done: done.has(id) }),
      actionsFor: (blockId) => {
        const block = blocks.find((b) => b.id === blockId);
        if (!block) return [];
        return buildActions(block, getCropState(block, today), forecast);
      },
      cropStateFor: (blockId) => {
        const block = blocks.find((b) => b.id === blockId);
        return block ? getCropState(block, today) : null;
      },
      blockById: (id) => blocks.find((b) => b.id === id),
      tasks: tasksQuery.data ?? [],
      addTask: async (task) => {
        const { error } = await supabase.from("tasks").insert({
          user_id: userId,
          title: task.title,
          detail: task.detail ?? null,
          kind: task.kind ?? "other",
          due_date: task.dueDate ?? null,
          block_id: task.blockId ?? null,
        });
        if (error) throw error;
        await invalidate("tasks");
      },
      toggleTask: async (id, doneNow) => {
        const { error } = await supabase.from("tasks").update({ done: !doneNow }).eq("id", id);
        if (error) throw error;
        await invalidate("tasks");
      },
      deleteTask: async (id) => {
        const { error } = await supabase.from("tasks").delete().eq("id", id);
        if (error) throw error;
        await invalidate("tasks");
      },
      updateBlock: async (id, patch) => {
        const { error } = await supabase.from("field_blocks").update(patch).eq("id", id);
        if (error) throw error;
        await invalidate("blocks");
      },
      addBlock: async (block) => {
        await createBlockRow({
          userId,
          name: block.name,
          areaHa: block.areaHa,
          soilType: block.soilType,
          crop: block.crop,
          sowingDate: block.sowingDate,
          irrigationMethod: block.irrigationMethod,
          photoUrl: block.photoUrl ?? null,
          latitude: profile.latitude ?? null,
          longitude: profile.longitude ?? null,
        });
        await invalidate("blocks");
      },
      removeBlock: async (id) => {
        await deleteBlockRow(id);
        await invalidate("blocks");
        await invalidate("tasks");
      },
      signOut: async () => {
        await qc.cancelQueries();
        qc.clear();
        await supabase.auth.signOut();
        window.location.href = "/auth";
      },
    };
  }, [
    profile,
    weather,
    weatherQuery.isStale,
    blocksQuery.data,
    tasksQuery.data,
    completionsQuery.data,
    today,
    userId,
    invalidate,
    qc,
    toggleCompletion,
  ]);

  if (profileQuery.isLoading || blocksQuery.isLoading) {
    return <LoadingFarm label="Opening your farm…" />;
  }
  if (!value) {
    if (weatherQuery.isError) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-lg font-semibold">Live weather is unreachable</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Every advisory on this dashboard is built from the real forecast for your village, so
            nothing is shown until it loads. Check your connection and retry.
          </p>
          <button
            onClick={() => weatherQuery.refetch()}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          >
            Retry
          </button>
        </div>
      );
    }
    return <LoadingFarm label="Reading the sky above your fields…" />;
  }

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
}

export function useFarm() {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error("useFarm must be used inside <FarmProvider>");
  return ctx;
}

export type { CropId };
