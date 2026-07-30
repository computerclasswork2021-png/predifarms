/**
 * Live weather from Open-Meteo (no API key, CORS-enabled).
 * Mapped onto the domain `WeatherDay` shape so the whole advisory engine keeps
 * working — only the source of truth changed, from fixtures to real forecasts.
 */
import type { WeatherDay } from "./farm";

export interface CurrentWeather {
  tempC: number;
  humidity: number;
  windKph: number;
  precipMm: number;
  isDay: boolean;
  condition: WeatherDay["condition"];
  code: number;
}

export interface LiveWeather {
  current: CurrentWeather;
  forecast: WeatherDay[];
  timezone: string;
  updatedAt: string;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function conditionFromCode(code: number, rainMm = 0): WeatherDay["condition"] {
  if (code >= 95) return "storm";
  if (code >= 80 || (code >= 51 && code <= 67) || code >= 71) return "rain";
  if (rainMm >= 8) return "rain";
  if (code >= 2) return "cloudy";
  return "clear";
}

export function describeCode(code: number) {
  if (code >= 95) return "Thunderstorm";
  if (code >= 80) return "Rain showers";
  if (code >= 71) return "Snow";
  if (code >= 61) return "Rain";
  if (code >= 51) return "Drizzle";
  if (code >= 45) return "Fog";
  if (code === 3) return "Overcast";
  if (code >= 1) return "Partly cloudy";
  return "Clear sky";
}

interface OpenMeteoResponse {
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    wind_speed_10m: number;
    weather_code: number;
    is_day: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: (number | null)[];
    wind_speed_10m_max: number[];
    weather_code: number[];
    relative_humidity_2m_mean: (number | null)[];
  };
}

const DAILY_FIELDS = [
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "precipitation_probability_max",
  "wind_speed_10m_max",
  "weather_code",
  "relative_humidity_2m_mean",
].join(",");

const CURRENT_FIELDS = [
  "temperature_2m",
  "relative_humidity_2m",
  "precipitation",
  "wind_speed_10m",
  "weather_code",
  "is_day",
].join(",");

export async function fetchWeather(latitude: number, longitude: number): Promise<LiveWeather> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&daily=${DAILY_FIELDS}&current=${CURRENT_FIELDS}&timezone=auto&forecast_days=7`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather service returned ${res.status}`);
  const json = (await res.json()) as OpenMeteoResponse;

  const forecast: WeatherDay[] = json.daily.time.map((iso, i) => {
    const rainMm = round(json.daily.precipitation_sum[i] ?? 0, 1);
    const code = json.daily.weather_code[i] ?? 0;
    const date = new Date(`${iso}T12:00:00`);
    return {
      offset: i,
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : DAY_NAMES[date.getDay()],
      tempMax: Math.round(json.daily.temperature_2m_max[i] ?? 0),
      tempMin: Math.round(json.daily.temperature_2m_min[i] ?? 0),
      rainMm,
      rainChance: Math.round(json.daily.precipitation_probability_max[i] ?? 0),
      windKph: Math.round(json.daily.wind_speed_10m_max[i] ?? 0),
      humidity: Math.round(json.daily.relative_humidity_2m_mean[i] ?? 60),
      condition: conditionFromCode(code, rainMm),
    };
  });

  return {
    timezone: json.timezone,
    updatedAt: json.current.time,
    forecast,
    current: {
      tempC: Math.round(json.current.temperature_2m),
      humidity: Math.round(json.current.relative_humidity_2m),
      windKph: Math.round(json.current.wind_speed_10m),
      precipMm: round(json.current.precipitation ?? 0, 1),
      isDay: json.current.is_day === 1,
      code: json.current.weather_code,
      condition: conditionFromCode(json.current.weather_code, json.current.precipitation ?? 0),
    },
  };
}

function round(n: number, dp: number) {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/* ------------------------------------------------------------------ */
/* Derived advisories straight from the live forecast                  */
/* ------------------------------------------------------------------ */

export interface SprayWindow {
  day: WeatherDay;
  today: boolean;
  reason: string;
}

export function sprayWindowFrom(forecast: WeatherDay[]): SprayWindow | null {
  const day = forecast.find((d) => d.rainMm < 1 && d.rainChance < 40 && d.windKph < 18);
  if (!day) return null;
  return {
    day,
    today: day.offset === 0,
    reason: `${day.windKph} kph wind, ${day.rainChance}% rain chance`,
  };
}

/** 0–100 modelled foliar disease pressure from humidity, rain and warmth. */
export function diseasePressure(forecast: WeatherDay[]) {
  const window = forecast.slice(0, 5);
  if (!window.length) return 0;
  const humidDays = window.filter((d) => d.humidity >= 80).length;
  const wetDays = window.filter((d) => d.rainMm >= 5).length;
  const warmDays = window.filter((d) => d.tempMax >= 24 && d.tempMax <= 33).length;
  const score = humidDays * 13 + wetDays * 9 + warmDays * 5;
  return Math.max(4, Math.min(98, Math.round(score)));
}

export type PartOfDay = "dawn" | "morning" | "afternoon" | "evening" | "night";

export function partOfDay(hour: number): PartOfDay {
  if (hour < 5) return "night";
  if (hour < 8) return "dawn";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 20) return "evening";
  return "night";
}

export function greetingFor(part: PartOfDay) {
  if (part === "night") return "Good night";
  if (part === "dawn" || part === "morning") return "Good morning";
  if (part === "afternoon") return "Good afternoon";
  return "Good evening";
}

/** Indian cropping season from the calendar month. */
export function seasonFor(month: number) {
  if (month >= 5 && month <= 9) return "Kharif";
  if (month >= 10 || month <= 2) return "Rabi";
  return "Zaid";
}
