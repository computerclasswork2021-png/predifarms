/** Location lookup for onboarding — Open-Meteo geocoding, no API key needed. */

export interface PlaceHit {
  id: number;
  name: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
}

interface GeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  admin2?: string;
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&country=IN`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("Location lookup failed");
  const json = (await res.json()) as { results?: GeoResult[] };
  return (json.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    state: r.admin1 ?? "",
    district: r.admin2 ?? r.name,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export const AREA_UNITS = [
  { id: "ha", label: "Hectare", perHa: 1 },
  { id: "acre", label: "Acre", perHa: 2.47105 },
  { id: "bigha", label: "Bigha (MP/Raj)", perHa: 3.9537 },
  { id: "guntha", label: "Guntha", perHa: 98.842 },
] as const;

export type AreaUnitId = (typeof AREA_UNITS)[number]["id"];

export function unitDef(id: string) {
  return AREA_UNITS.find((u) => u.id === id) ?? AREA_UNITS[0];
}

export function toHectares(value: number, unit: string) {
  return value / unitDef(unit).perHa;
}

export function fromHectares(ha: number, unit: string) {
  return ha * unitDef(unit).perHa;
}

export function formatArea(ha: number, unit: string) {
  const v = fromHectares(ha, unit);
  const label = unit === "ha" ? "ha" : unitDef(unit).label.split(" ")[0].toLowerCase();
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${label}`;
}
