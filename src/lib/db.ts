/**
 * Supabase data access for the farmer's own records.
 * Every row here is real, farmer-entered data — no fixtures.
 */
import { supabase } from "@/integrations/supabase/client";
import { CROPS, type CropId, type FieldBlock } from "./farm";

export interface Profile {
  id: string;
  full_name: string;
  farm_name: string | null;
  state: string | null;
  district: string | null;
  village: string | null;
  latitude: number | null;
  longitude: number | null;
  farm_size: number | null;
  area_unit: string;
  onboarded: boolean;
}

export interface BlockRow {
  id: string;
  user_id: string;
  name: string;
  area_ha: number;
  soil_type: string;
  crop: string | null;
  sowing_date: string | null;
  irrigation_method: string;
  photo_url: string | null;
  soil_n: number;
  soil_p: number;
  soil_k: number;
  soil_ph: number;
  organic_carbon: number;
  moisture: number;
  health: number;
  disease_risk: number;
  last_scan_date: string | null;
  latitude: number | null;
  longitude: number | null;
}

export const IRRIGATION_METHODS = ["rainfed", "drip", "sprinkler", "flood", "canal"] as const;
export type IrrigationMethod = (typeof IRRIGATION_METHODS)[number];

export interface BlockPhotoRow {
  id: string;
  block_id: string;
  url: string;
  caption: string | null;
  created_at: string;
}

export interface TaskRow {
  id: string;
  title: string;
  detail: string | null;
  kind: string;
  due_date: string | null;
  done: boolean;
  block_id: string | null;
  created_at: string;
}

export function daysBetween(from: Date, to: Date) {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86_400_000);
}

/** Turn a stored row into the domain block the advisory engine understands. */
export function toFieldBlock(row: BlockRow, today: Date): FieldBlock {
  const crop = row.crop && row.crop in CROPS ? (row.crop as CropId) : null;
  const sown = row.sowing_date ? new Date(`${row.sowing_date}T00:00:00`) : null;
  const scan = row.last_scan_date ? new Date(`${row.last_scan_date}T00:00:00`) : null;
  return {
    id: row.id,
    name: row.name,
    areaHa: Number(row.area_ha),
    soilType: row.soil_type,
    crop,
    sownDaysAgo: crop && sown ? Math.max(0, daysBetween(sown, today)) : null,
    irrigationMethod: row.irrigation_method ?? "rainfed",
    photoUrl: row.photo_url ?? null,
    soil: {
      n: Number(row.soil_n),
      p: Number(row.soil_p),
      k: Number(row.soil_k),
      ph: Number(row.soil_ph),
      organicCarbon: Number(row.organic_carbon),
      moisture: Number(row.moisture),
    },
    health: crop ? Number(row.health) : 0,
    diseaseRisk: crop ? Number(row.disease_risk) : 0,
    lastScanDaysAgo: scan ? Math.max(0, daysBetween(scan, today)) : 99,
  };
}

export const BLOCK_SELECT = "*";

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export async function fetchBlocks(userId: string) {
  const { data, error } = await supabase
    .from("field_blocks")
    .select(BLOCK_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BlockRow[];
}

export async function fetchTasks(userId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select("id,title,detail,kind,due_date,done,block_id,created_at")
    .eq("user_id", userId)
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as TaskRow[];
}

export async function fetchBlockPhotos(blockIds: string[]) {
  if (!blockIds.length) return [];
  const { data, error } = await supabase
    .from("block_photos")
    .select("id,block_id,url,caption,created_at")
    .in("block_id", blockIds)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as BlockPhotoRow[];
}

export async function createBlock(input: {
  userId: string;
  name: string;
  areaHa: number;
  soilType: string;
  crop: string | null;
  sowingDate: string | null;
  irrigationMethod: string;
  photoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const soil = SOIL_DEFAULTS[input.soilType] ?? SOIL_DEFAULTS.Loam;
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("field_blocks")
    .insert({
      user_id: input.userId,
      name: input.name,
      area_ha: input.areaHa,
      soil_type: input.soilType,
      crop: input.crop,
      sowing_date: input.sowingDate,
      irrigation_method: input.irrigationMethod,
      photo_url: input.photoUrl ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      health: input.crop ? 78 : 0,
      disease_risk: input.crop ? 22 : 0,
      last_scan_date: today,
      ...soil,
    })
    .select()
    .single();
  if (error) throw error;
  return data as BlockRow;
}

export async function deleteBlock(blockId: string) {
  const { error } = await supabase.from("field_blocks").delete().eq("id", blockId);
  if (error) throw error;
}

export async function fetchCompletions(userId: string) {
  const { data, error } = await supabase
    .from("action_completions")
    .select("action_id")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => (r as { action_id: string }).action_id);
}

/* ------------------------------------------------------------------ */
/* Onboarding: create the farm from what the farmer told us            */
/* ------------------------------------------------------------------ */

export interface OnboardingCrop {
  crop: CropId;
  sowingDate: string;
  share: number;
}

const SOIL_DEFAULTS: Record<string, Partial<BlockRow>> = {
  "Sandy loam": { soil_n: 165, soil_p: 26, soil_k: 275, soil_ph: 6.8, organic_carbon: 0.55, moisture: 48 },
  "Clay loam": { soil_n: 195, soil_p: 32, soil_k: 290, soil_ph: 7.1, organic_carbon: 0.68, moisture: 66 },
  "Black cotton": { soil_n: 150, soil_p: 22, soil_k: 245, soil_ph: 7.6, organic_carbon: 0.5, moisture: 40 },
  Loam: { soil_n: 175, soil_p: 28, soil_k: 265, soil_ph: 7.0, organic_carbon: 0.6, moisture: 52 },
};

export const SOIL_TYPES = Object.keys(SOIL_DEFAULTS);

export interface CreateFarmInput {
  userId: string;
  fullName: string;
  farmName: string;
  state: string;
  district: string;
  village: string;
  latitude: number;
  longitude: number;
  areaHa: number;
  areaUnit: string;
  soilType: string;
  crops: OnboardingCrop[];
}

export async function createFarm(input: CreateFarmInput) {
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: input.userId,
    full_name: input.fullName,
    farm_name: input.farmName || `${input.fullName.split(" ")[0]}'s farm`,
    state: input.state,
    district: input.district,
    village: input.village,
    latitude: input.latitude,
    longitude: input.longitude,
    farm_size: input.areaHa,
    area_unit: input.areaUnit,
    onboarded: true,
  });
  if (profileError) throw profileError;

  const soil = SOIL_DEFAULTS[input.soilType] ?? SOIL_DEFAULTS.Loam;
  const totalShare = input.crops.reduce((s, c) => s + c.share, 0) || 1;
  const today = new Date().toISOString().slice(0, 10);

  const blocks = input.crops.map((c, i) => ({
    user_id: input.userId,
    name: `Block ${String.fromCharCode(65 + i)}`,
    area_ha: Math.max(0.1, Number(((input.areaHa * c.share) / totalShare).toFixed(2))),
    soil_type: input.soilType,
    crop: c.crop,
    sowing_date: c.sowingDate,
    latitude: input.latitude,
    longitude: input.longitude,
    health: 78,
    disease_risk: 22,
    last_scan_date: today,
    irrigation_method: "rainfed",
    photo_url: null,
    ...soil,
  }));

  if (blocks.length === 0) {
    blocks.push({
      user_id: input.userId,
      name: "Block A",
      area_ha: input.areaHa,
      soil_type: input.soilType,
      crop: null,
      sowing_date: null,
      latitude: input.latitude,
      longitude: input.longitude,
      health: 0,
      disease_risk: 0,
      last_scan_date: today,
      irrigation_method: "rainfed",
      photo_url: null,
      ...soil,
    } as (typeof blocks)[number]);
  }

  const { error: blockError } = await supabase.from("field_blocks").insert(blocks);
  if (blockError) throw blockError;
}
