/**
 * PREDI-FARM X — domain model.
 *
 * Single source of truth for crops, field blocks, weather and the advisory
 * engine. Everything the UI shows is derived from here, so numbers can never
 * disagree between two screens.
 *
 * Units (fixed once, used everywhere):
 *   area      hectares (ha)
 *   yield     tonnes per hectare (t/ha)
 *   price     rupees per quintal (₹/q)   1 tonne = 10 quintal
 *   rain      millimetres (mm)
 */

export type CropId = "wheat" | "rice" | "soybean" | "maize";

export interface StageDef {
  id: string;
  name: string;
  /** days after sowing at which this stage begins */
  from: number;
  focus: string;
}

export interface CropDef {
  id: CropId;
  label: string;
  season: string;
  cycleDays: number;
  /** realistic Indian average, t/ha */
  baseYield: number;
  /** ₹ per quintal */
  price: number;
  /** ₹ per hectare, whole cycle */
  inputCostPerHa: number;
  waterNeedMm: number;
  stages: StageDef[];
  /** stage ids where a top-dress / nutrient split is agronomically due */
  nutrientWindows: string[];
  /** pre-harvest interval for common fungicides, days */
  phiDays: number;
}

const stage = (id: string, name: string, from: number, focus: string): StageDef => ({
  id,
  name,
  from,
  focus,
});

export const CROPS: Record<CropId, CropDef> = {
  wheat: {
    id: "wheat",
    label: "Wheat",
    season: "Rabi",
    cycleDays: 140,
    baseYield: 4.2,
    price: 2425,
    inputCostPerHa: 38000,
    waterNeedMm: 450,
    phiDays: 21,
    nutrientWindows: ["tillering", "jointing"],
    stages: [
      stage("germination", "Germination", 0, "Keep the seed bed moist, watch for crusting"),
      stage("tillering", "Tillering", 21, "First nitrogen top-dress decides tiller count"),
      stage("jointing", "Jointing", 45, "Stem elongation — moisture stress hurts most here"),
      stage("flowering", "Flowering", 75, "Rust risk peaks. No new crop decisions possible"),
      stage("grain-fill", "Grain fill", 95, "Protect the flag leaf, keep light irrigation"),
      stage("ripening", "Ripening", 120, "Plan harvest, stop irrigation, track mandi price"),
    ],
  },
  rice: {
    id: "rice",
    label: "Rice",
    season: "Kharif",
    cycleDays: 135,
    baseYield: 4.0,
    price: 2300,
    inputCostPerHa: 42000,
    waterNeedMm: 1100,
    phiDays: 14,
    nutrientWindows: ["tillering", "panicle"],
    stages: [
      stage("transplant", "Transplanting", 0, "Maintain 2–3 cm standing water"),
      stage("tillering", "Tillering", 20, "Nitrogen split one, weed control window"),
      stage("panicle", "Panicle initiation", 55, "Highest yield-sensitive nutrient window"),
      stage("flowering", "Flowering", 80, "Never let the field dry out"),
      stage("grain-fill", "Grain fill", 100, "Drain slowly, watch for neck blast"),
      stage("ripening", "Ripening", 118, "Drain field 10 days before harvest"),
    ],
  },
  soybean: {
    id: "soybean",
    label: "Soybean",
    season: "Kharif",
    cycleDays: 105,
    baseYield: 1.3,
    price: 4892,
    inputCostPerHa: 28000,
    waterNeedMm: 500,
    phiDays: 21,
    nutrientWindows: ["vegetative"],
    stages: [
      stage("emergence", "Emergence", 0, "Thin crust, ensure even stand"),
      stage("vegetative", "Vegetative", 18, "Sulphur + phosphorus matter more than nitrogen"),
      stage("flowering", "Flowering", 42, "Moisture stress now costs pods directly"),
      stage("pod-fill", "Pod fill", 62, "Peak water demand, scout for girdle beetle"),
      stage("maturity", "Maturity", 92, "Harvest at 14% moisture to avoid shattering"),
    ],
  },
  maize: {
    id: "maize",
    label: "Maize",
    season: "Kharif",
    cycleDays: 115,
    baseYield: 5.6,
    price: 2225,
    inputCostPerHa: 36000,
    waterNeedMm: 600,
    phiDays: 14,
    nutrientWindows: ["vegetative", "tasseling"],
    stages: [
      stage("emergence", "Emergence", 0, "Fall armyworm scouting starts on day 7"),
      stage("vegetative", "Vegetative", 16, "Knee-high nitrogen split"),
      stage("tasseling", "Tasseling", 50, "Water stress here can cost 40% of the yield"),
      stage("grain-fill", "Grain fill", 72, "Keep soil at field capacity"),
      stage("maturity", "Maturity", 100, "Black layer means it is ready"),
    ],
  },
};

export const CROP_LIST = Object.values(CROPS);

/* ------------------------------------------------------------------ */
/* Field blocks                                                        */
/* ------------------------------------------------------------------ */

export interface SoilReading {
  n: number; // kg/ha
  p: number;
  k: number;
  ph: number;
  organicCarbon: number; // %
  moisture: number; // % of field capacity
}

export interface FieldBlock {
  id: string;
  name: string;
  areaHa: number;
  soilType: string;
  /** null = fallow, ready for a new crop */
  crop: CropId | null;
  /** days ago the crop was sown; null when fallow */
  sownDaysAgo: number | null;
  soil: SoilReading;
  /** 0–100 canopy/health index from the last scan */
  health: number;
  /** 0–100 modelled disease pressure */
  diseaseRisk: number;
  lastScanDaysAgo: number;
}

export const BLOCKS: FieldBlock[] = [
  {
    id: "a",
    name: "Block A",
    areaHa: 12,
    soilType: "Sandy loam",
    crop: "wheat",
    sownDaysAgo: 78,
    soil: { n: 182, p: 28, k: 310, ph: 6.8, organicCarbon: 0.62, moisture: 58 },
    health: 82,
    diseaseRisk: 74,
    lastScanDaysAgo: 1,
  },
  {
    id: "b",
    name: "Block B",
    areaHa: 8,
    soilType: "Clay loam",
    crop: "rice",
    sownDaysAgo: 122,
    soil: { n: 210, p: 34, k: 285, ph: 7.1, organicCarbon: 0.74, moisture: 76 },
    health: 91,
    diseaseRisk: 18,
    lastScanDaysAgo: 3,
  },
  {
    id: "c",
    name: "Block C",
    areaHa: 6,
    soilType: "Black cotton",
    crop: "soybean",
    sownDaysAgo: 66,
    soil: { n: 148, p: 19, k: 240, ph: 7.6, organicCarbon: 0.48, moisture: 34 },
    health: 71,
    diseaseRisk: 41,
    lastScanDaysAgo: 6,
  },
  {
    id: "d",
    name: "Block D",
    areaHa: 9,
    soilType: "Sandy loam",
    crop: null,
    sownDaysAgo: null,
    soil: { n: 165, p: 41, k: 262, ph: 6.5, organicCarbon: 0.58, moisture: 47 },
    health: 0,
    diseaseRisk: 0,
    lastScanDaysAgo: 12,
  },
];

export const FARM = {
  name: "Rathore Farms",
  farmer: "Arjun Rathore",
  village: "Sehore, Madhya Pradesh",
  get areaHa() {
    return BLOCKS.reduce((s, b) => s + b.areaHa, 0);
  },
};

/* ------------------------------------------------------------------ */
/* Weather                                                             */
/* ------------------------------------------------------------------ */

export interface WeatherDay {
  /** 0 = today */
  offset: number;
  label: string;
  tempMax: number;
  tempMin: number;
  rainMm: number;
  rainChance: number;
  windKph: number;
  humidity: number;
  condition: "clear" | "cloudy" | "rain" | "storm";
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const RAW_FORECAST: Array<Omit<WeatherDay, "offset" | "label">> = [
  { tempMax: 31, tempMin: 22, rainMm: 0, rainChance: 10, windKph: 8, humidity: 58, condition: "clear" },
  { tempMax: 30, tempMin: 22, rainMm: 2, rainChance: 35, windKph: 14, humidity: 66, condition: "cloudy" },
  { tempMax: 27, tempMin: 21, rainMm: 24, rainChance: 85, windKph: 22, humidity: 84, condition: "storm" },
  { tempMax: 26, tempMin: 21, rainMm: 16, rainChance: 70, windKph: 18, humidity: 82, condition: "rain" },
  { tempMax: 29, tempMin: 21, rainMm: 1, rainChance: 20, windKph: 9, humidity: 64, condition: "cloudy" },
  { tempMax: 32, tempMin: 22, rainMm: 0, rainChance: 5, windKph: 7, humidity: 52, condition: "clear" },
  { tempMax: 33, tempMin: 23, rainMm: 0, rainChance: 5, windKph: 10, humidity: 49, condition: "clear" },
];

/** Deterministic on the server and the client: derived from the calendar day. */
export function getForecast(today: Date): WeatherDay[] {
  const dow = today.getDay();
  return RAW_FORECAST.map((d, i) => ({
    ...d,
    offset: i,
    label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : DAY_NAMES[(dow + i) % 7],
  }));
}

export function rainWithin(forecast: WeatherDay[], days: number) {
  return forecast.slice(0, days).reduce((s, d) => s + d.rainMm, 0);
}

/** First day that is dry, low-wind and therefore safe to spray. */
export function nextSprayWindow(forecast: WeatherDay[]) {
  return forecast.find((d) => d.rainMm < 1 && d.rainChance < 30 && d.windKph < 15) ?? null;
}

/* ------------------------------------------------------------------ */
/* Derived crop state                                                  */
/* ------------------------------------------------------------------ */

export interface CropState {
  crop: CropDef;
  dap: number; // days after sowing
  stage: StageDef;
  stageIndex: number;
  nextStage: StageDef | null;
  daysToNextStage: number | null;
  progress: number; // 0–1 of the whole cycle
  daysToHarvest: number;
  harvestDate: Date;
  inNutrientWindow: boolean;
  withinPhi: boolean;
  /** the crop is committed — switching crops is no longer an option */
  locked: boolean;
}

export function getCropState(block: FieldBlock, today: Date): CropState | null {
  if (!block.crop || block.sownDaysAgo == null) return null;
  const crop = CROPS[block.crop];
  const dap = block.sownDaysAgo;
  let stageIndex = 0;
  crop.stages.forEach((s, i) => {
    if (dap >= s.from) stageIndex = i;
  });
  const current = crop.stages[stageIndex];
  const next = crop.stages[stageIndex + 1] ?? null;
  const daysToHarvest = Math.max(0, crop.cycleDays - dap);
  const harvestDate = new Date(today.getTime() + daysToHarvest * 86400000);
  return {
    crop,
    dap,
    stage: current,
    stageIndex,
    nextStage: next,
    daysToNextStage: next ? next.from - dap : null,
    progress: Math.min(1, dap / crop.cycleDays),
    daysToHarvest,
    harvestDate,
    inNutrientWindow: crop.nutrientWindows.includes(current.id),
    withinPhi: daysToHarvest <= crop.phiDays,
    locked: stageIndex >= 1,
  };
}

/** Yield forecast that actually reacts to the block's condition. */
export function yieldForecast(block: FieldBlock, state: CropState | null) {
  if (!state) return 0;
  const healthFactor = 0.55 + (block.health / 100) * 0.5; // 0.55 – 1.05
  const moistureFactor =
    block.soil.moisture < 35 ? 0.82 : block.soil.moisture > 85 ? 0.93 : 1;
  const diseaseFactor = 1 - (block.diseaseRisk / 100) * 0.22;
  return +(state.crop.baseYield * healthFactor * moistureFactor * diseaseFactor).toFixed(2);
}

export interface BlockEconomics {
  yieldPerHa: number;
  totalTonnes: number;
  quintals: number;
  grossRevenue: number;
  inputCost: number;
  netProfit: number;
}

export function blockEconomics(block: FieldBlock, state: CropState | null): BlockEconomics | null {
  if (!state) return null;
  const yieldPerHa = yieldForecast(block, state);
  const totalTonnes = yieldPerHa * block.areaHa;
  const quintals = totalTonnes * 10;
  const grossRevenue = quintals * state.crop.price;
  const inputCost = state.crop.inputCostPerHa * block.areaHa;
  return {
    yieldPerHa,
    totalTonnes: +totalTonnes.toFixed(1),
    quintals: Math.round(quintals),
    grossRevenue: Math.round(grossRevenue),
    inputCost: Math.round(inputCost),
    netProfit: Math.round(grossRevenue - inputCost),
  };
}

/* ------------------------------------------------------------------ */
/* Advisory engine — one reconciled plan, no contradictions            */
/* ------------------------------------------------------------------ */

export type ActionKind = "irrigate" | "spray" | "nutrient" | "harvest" | "scout" | "sow" | "sell";
export type ActionUrgency = "critical" | "today" | "this-week" | "planned";

export interface FarmAction {
  id: string;
  blockId: string;
  blockName: string;
  kind: ActionKind;
  urgency: ActionUrgency;
  title: string;
  detail: string;
  /** why the engine chose this — shown so the farmer can disagree */
  because: string;
  window: string;
  /** rupees at stake if ignored; null when not quantifiable */
  impact: number | null;
  /** set when weather or PHI blocks the obvious action */
  blocked?: string;
}

const inr = (n: number) => Math.round(n);

export function buildActions(
  block: FieldBlock,
  state: CropState | null,
  forecast: WeatherDay[],
): FarmAction[] {
  const out: FarmAction[] = [];
  const rain48 = rainWithin(forecast, 2);
  const rain24 = rainWithin(forecast, 1);
  const spray = nextSprayWindow(forecast);
  const econ = blockEconomics(block, state);
  const base = { blockId: block.id, blockName: block.name };

  /* Fallow land ------------------------------------------------------ */
  if (!state) {
    out.push({
      ...base,
      id: `${block.id}-sow`,
      kind: "sow",
      urgency: "this-week",
      title: `Choose a crop for ${block.name}`,
      detail: `${block.areaHa} ha is lying fallow. The sowing window for the coming season is open.`,
      because: `No standing crop. Soil P is ${block.soil.p} kg/ha and pH ${block.soil.ph}, which narrows the sensible choices.`,
      window: "Sowing window open",
      impact: null,
    });
    return out;
  }

  /* Harvest ---------------------------------------------------------- */
  if (state.daysToHarvest <= 12) {
    out.push({
      ...base,
      id: `${block.id}-harvest`,
      kind: "harvest",
      urgency: state.daysToHarvest <= 5 ? "critical" : "this-week",
      title: `Harvest ${state.crop.label} in ${state.daysToHarvest} days`,
      detail:
        rainWithin(forecast, 4) > 15
          ? `${Math.round(rainWithin(forecast, 4))} mm of rain is forecast in the next 4 days. Bring the harvest forward or arrange covered storage.`
          : `Weather stays dry through the window. Book the harvester now.`,
      because: `Day ${state.dap} of a ${state.crop.cycleDays} day cycle — the crop is in ${state.stage.name.toLowerCase()}.`,
      window: `Best window: next ${state.daysToHarvest || 1}–${state.daysToHarvest + 4} days`,
      impact: econ ? inr(econ.grossRevenue * 0.08) : null,
    });
  }

  /* Irrigation — reconciled against rainfall --------------------------- */
  const dry = block.soil.moisture < 45;
  if (dry && rain48 >= 10) {
    out.push({
      ...base,
      id: `${block.id}-irrigate-skip`,
      kind: "irrigate",
      urgency: "planned",
      title: `Hold irrigation on ${block.name}`,
      detail: `Moisture is low at ${block.soil.moisture}%, but ${Math.round(rain48)} mm of rain arrives within 48 hours. Irrigating now wastes water and risks lodging.`,
      because: "Soil moisture below 45% would normally trigger irrigation — the forecast overrides it.",
      window: "Re-check after the rain passes",
      impact: null,
    });
  } else if (dry) {
    out.push({
      ...base,
      id: `${block.id}-irrigate`,
      kind: "irrigate",
      urgency: block.soil.moisture < 35 ? "critical" : "today",
      title: `Irrigate ${block.name} — ${Math.round((55 - block.soil.moisture) * 1.2)} mm`,
      detail: `Moisture is ${block.soil.moisture}% against a ${state.stage.name.toLowerCase()} target of 55–65%. Only ${Math.round(rain48)} mm of rain is expected in 48 hours.`,
      because: `${state.crop.label} at ${state.stage.name.toLowerCase()} loses yield fastest to water stress.`,
      window: "Today, before 10 am",
      impact: econ ? inr(econ.grossRevenue * 0.12) : null,
    });
  } else if (block.soil.moisture > 85) {
    out.push({
      ...base,
      id: `${block.id}-drain`,
      kind: "irrigate",
      urgency: "this-week",
      title: `Improve drainage in ${block.name}`,
      detail: `Moisture at ${block.soil.moisture}% with more rain forecast. Standing water past 3 days starves the roots of oxygen.`,
      because: "Moisture above 85% of field capacity for this stage.",
      window: "Before the next spell",
      impact: null,
    });
  }

  /* Disease --------------------------------------------------------- */
  if (block.diseaseRisk >= 55) {
    const blockedByPhi = state.withinPhi;
    const canSprayToday = spray?.offset === 0;
    out.push({
      ...base,
      id: `${block.id}-spray`,
      kind: "spray",
      urgency: blockedByPhi ? "this-week" : canSprayToday ? "critical" : "today",
      title: blockedByPhi
        ? `Do not spray ${block.name} — harvest is too close`
        : `Spray ${block.name} against ${state.crop.label === "Wheat" ? "leaf rust" : "foliar blight"}`,
      detail: blockedByPhi
        ? `Disease pressure is ${block.diseaseRisk}%, but harvest is in ${state.daysToHarvest} days and the pre-harvest interval is ${state.crop.phiDays} days. Spraying now leaves residue in the grain.`
        : `Modelled pressure ${block.diseaseRisk}%. Use a protectant at label dose on ${block.areaHa} ha.`,
      because: `Humidity above 80% for ${forecast.filter((d) => d.humidity > 80).length} of the next 7 days with a susceptible ${state.stage.name.toLowerCase()} canopy.`,
      window: blockedByPhi
        ? "Manage by harvesting on time instead"
        : spray
          ? `${spray.label} — ${spray.windKph} kph wind, ${spray.rainMm} mm rain`
          : "No dry window in 7 days",
      impact: econ ? inr(econ.grossRevenue * 0.17) : null,
      blocked: blockedByPhi
        ? `Pre-harvest interval: ${state.crop.phiDays} days`
        : canSprayToday
          ? undefined
          : `Wait for ${spray?.label ?? "a dry day"} — rain would wash it off`,
    });
  } else if (block.lastScanDaysAgo >= 5) {
    out.push({
      ...base,
      id: `${block.id}-scout`,
      kind: "scout",
      urgency: "this-week",
      title: `Scan ${block.name} — last checked ${block.lastScanDaysAgo} days ago`,
      detail: "Walk a diagonal transect and photograph 5 leaves. Early detection is worth more than any spray.",
      because: "No leaf scan in the last 5 days while humidity is rising.",
      window: "Any morning this week",
      impact: null,
    });
  }

  /* Nutrients — only in the right stage, never before heavy rain ------ */
  if (state.inNutrientWindow) {
    const washout = rain24 >= 10;
    out.push({
      ...base,
      id: `${block.id}-nutrient`,
      kind: "nutrient",
      urgency: washout ? "planned" : "this-week",
      title: washout
        ? `Delay the ${state.stage.name.toLowerCase()} top-dress on ${block.name}`
        : `Top-dress nitrogen on ${block.name}`,
      detail: washout
        ? `${Math.round(rain24)} mm of rain in 24 hours would leach most of the urea. Apply once the field is walkable again.`
        : `Apply ${Math.round(block.areaHa * 55)} kg urea across ${block.areaHa} ha. Soil N is ${block.soil.n} kg/ha, below the ${state.stage.name.toLowerCase()} target.`,
      because: `${state.crop.label} takes up the most nitrogen during ${state.stage.name.toLowerCase()}.`,
      window: washout ? "After the rain, likely in 3 days" : "Within 5 days",
      impact: econ ? inr(econ.grossRevenue * 0.09) : null,
      blocked: washout ? "Heavy rain within 24 hours" : undefined,
    });
  }

  /* Market ----------------------------------------------------------- */
  if (state.daysToHarvest <= 25 && econ) {
    out.push({
      ...base,
      id: `${block.id}-sell`,
      kind: "sell",
      urgency: "planned",
      title: `Plan the sale of ${econ.quintals} q of ${state.crop.label}`,
      detail: `At today's ₹${state.crop.price}/q the block grosses ₹${(econ.grossRevenue / 100000).toFixed(2)} L. Staggering the sale over 3 weeks has historically beaten a single-day sale.`,
      because: `Harvest lands in ${state.daysToHarvest} days and arrivals peak roughly a week later.`,
      window: "Decide before harvest day",
      impact: inr(econ.grossRevenue * 0.05),
    });
  }

  return out;
}

export const URGENCY_ORDER: Record<ActionUrgency, number> = {
  critical: 0,
  today: 1,
  "this-week": 2,
  planned: 3,
};

export function buildFarmPlan(blocks: FieldBlock[], forecast: WeatherDay[], today: Date) {
  return blocks
    .flatMap((b) => buildActions(b, getCropState(b, today), forecast))
    .sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]);
}

/* ------------------------------------------------------------------ */
/* Crop recommendation — only ever offered for land that is free       */
/* ------------------------------------------------------------------ */

export interface CropSuggestion {
  crop: CropDef;
  score: number;
  netPerHa: number;
  reasons: string[];
  cautions: string[];
}

export function suggestCrops(block: FieldBlock): CropSuggestion[] {
  return CROP_LIST.map((crop) => {
    const reasons: string[] = [];
    const cautions: string[] = [];
    let score = 62;

    if (block.soil.ph >= 6 && block.soil.ph <= 7.5) {
      score += 8;
      reasons.push(`pH ${block.soil.ph} sits in the comfortable band`);
    } else if (crop.id === "soybean" && block.soil.ph > 7.5) {
      score += 4;
      reasons.push("Tolerates the alkaline patch better than cereals");
    } else {
      score -= 6;
      cautions.push(`pH ${block.soil.ph} is outside the ideal range`);
    }

    if (crop.waterNeedMm > 800 && block.soil.moisture < 55) {
      score -= 14;
      cautions.push(`Needs ~${crop.waterNeedMm} mm — this block holds water poorly`);
    } else if (crop.waterNeedMm <= 600) {
      score += 7;
      reasons.push(`Modest ${crop.waterNeedMm} mm water need`);
    }

    if (block.soil.n < 160 && crop.id === "soybean") {
      score += 9;
      reasons.push("Fixes its own nitrogen — good after a cereal");
    } else if (block.soil.n < 160) {
      score -= 5;
      cautions.push(`Soil N is ${block.soil.n} kg/ha; budget an extra top-dress`);
    }

    if (block.soil.p >= 35) {
      score += 5;
      reasons.push(`Phosphorus at ${block.soil.p} kg/ha is already sufficient`);
    }

    const netPerHa = Math.round(crop.baseYield * 10 * crop.price - crop.inputCostPerHa);
    if (netPerHa > 20000) {
      score += 6;
      reasons.push(`₹${(netPerHa / 1000).toFixed(0)}k net per hectare at today's price`);
    }

    return {
      crop,
      score: Math.max(35, Math.min(96, Math.round(score))),
      netPerHa,
      reasons: reasons.slice(0, 3),
      cautions: cautions.slice(0, 2),
    };
  }).sort((a, b) => b.score - a.score);
}

/* ------------------------------------------------------------------ */
/* Mandi                                                               */
/* ------------------------------------------------------------------ */

export interface MandiRow {
  crop: CropDef;
  price: number;
  change7d: number;
  msp: number;
  arrivalsQ: number;
  history: number[];
  bestMandi: string;
  distanceKm: number;
}

const MSP: Record<CropId, number> = { wheat: 2275, rice: 2300, soybean: 4892, maize: 2225 };

export const MANDI_ROWS: MandiRow[] = [
  { id: "wheat" as CropId, change7d: 2.4, arrivals: 4200, best: "Sehore Mandi", km: 14, hist: [2340, 2355, 2372, 2361, 2390, 2408, 2425] },
  { id: "rice" as CropId, change7d: -1.1, arrivals: 3100, best: "Ashta Mandi", km: 28, hist: [2326, 2318, 2310, 2295, 2288, 2296, 2300] },
  { id: "soybean" as CropId, change7d: 3.8, arrivals: 5600, best: "Indore Mandi", km: 62, hist: [4712, 4740, 4788, 4802, 4835, 4870, 4892] },
  { id: "maize" as CropId, change7d: 0.6, arrivals: 2400, best: "Sehore Mandi", km: 14, hist: [2211, 2205, 2214, 2220, 2218, 2222, 2225] },
].map((r) => ({
  crop: CROPS[r.id],
  price: CROPS[r.id].price,
  change7d: r.change7d,
  msp: MSP[r.id],
  arrivalsQ: r.arrivals,
  history: r.hist,
  bestMandi: r.best,
  distanceKm: r.km,
}));

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

export function formatINR(value: number) {
  if (Math.abs(value) >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (Math.abs(value) >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return `₹${Math.round(value)}`;
}

export function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
