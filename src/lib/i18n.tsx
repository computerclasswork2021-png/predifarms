import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
export type Lang = "en" | "hi";

/**
 * Hindi dictionary keyed by the English source string. Any string wrapped in
 * `t()` switches language; anything not yet translated falls back to English
 * rather than showing a raw key, so the UI never breaks mid-translation.
 */
const HI: Record<string, string> = {
  // Shell / navigation
  "Action Plan": "आज का काम",
  Today: "आज",
  "My Fields": "मेरे खेत",
  Fields: "खेत",
  Diagnose: "जाँच",
  Soil: "मिट्टी",
  "Leaf Scan": "पत्ती जाँच",
  Scan: "स्कैन",
  Weather: "मौसम",
  Plan: "योजना",
  Crops: "फसलें",
  Mandi: "मंडी",
  "Mandi Prices": "मंडी भाव",
  Simulator: "अनुमान",
  "What-if": "क्या-अगर",
  Assistant: "सहायक",
  Reports: "रिपोर्ट",
  Settings: "सेटिंग",
  "Farm settings": "खेत की सेटिंग",
  "Sign out": "साइन आउट",
  "Open navigation": "मेन्यू खोलें",
  "Close navigation": "मेन्यू बंद करें",
  "Account menu": "खाता मेन्यू",
  Menu: "मेन्यू",
  Close: "बंद",

  // Time / clock
  Morning: "सुबह",
  Afternoon: "दोपहर",
  Evening: "शाम",
  Night: "रात",
  "Local farm time": "आपके खेत का समय",

  // Settings page
  "Appearance and language": "रूप और भाषा",
  "Everything here is saved on this device and applies to the whole app.":
    "यह सब इसी डिवाइस पर सुरक्षित रहता है और पूरे ऐप पर लागू होता है।",
  Theme: "थीम",
  Light: "उजाला",
  Dark: "अँधेरा",
  System: "सिस्टम",
  Language: "भाषा",
  English: "English",
  Hindi: "हिन्दी",
  "Text size": "अक्षर का आकार",
  Small: "छोटा",
  Normal: "सामान्य",
  Large: "बड़ा",
  "Extra large": "बहुत बड़ा",
  "Make every word in the app bigger or smaller.":
    "ऐप के सभी अक्षर बड़े या छोटे करें।",
  Farm: "खेत",
  Name: "नाम",
  Farmer: "किसान",
  Village: "गाँव",
  "Total area": "कुल क्षेत्रफल",
  Units: "इकाइयाँ",
  "Yield in t/ha": "उपज टन/हेक्टेयर में",
  "Price in ₹/quintal": "भाव ₹/क्विंटल में",
  "Area in hectares": "क्षेत्र हेक्टेयर में",
  "Your farm, your units, your language": "आपका खेत, आपकी इकाई, आपकी भाषा",
  "These settings shape every number and every piece of advice in the app.":
    "ये सेटिंग ऐप की हर संख्या और हर सलाह को तय करती हैं।",
};

interface PrefsValue {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  resolvedTheme: "light" | "dark";
  lang: Lang;
  setLang: (l: Lang) => void;
  fontScale: number;
  setFontScale: (n: number) => void;
  t: (s: string) => string;
}

const PrefsContext = createContext<PrefsValue | null>(null);

const KEY = "predifarm.prefs.v1";

function readStored(): { theme: ThemeMode; lang: Lang; fontScale: number } {
  if (typeof window === "undefined") return { theme: "dark", lang: "en", fontScale: 1 };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { theme: "dark", lang: "en", fontScale: 1 };
    const p = JSON.parse(raw) as Partial<{ theme: ThemeMode; lang: Lang; fontScale: number }>;
    return {
      theme: p.theme ?? "dark",
      lang: p.lang === "hi" ? "hi" : "en",
      fontScale: typeof p.fontScale === "number" ? p.fontScale : 1,
    };
  } catch {
    return { theme: "dark", lang: "en", fontScale: 1 };
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  // Defaults on first render must match SSR output; real values load in effect.
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [lang, setLangState] = useState<Lang>("en");
  const [fontScale, setFontScaleState] = useState(1);
  const [systemDark, setSystemDark] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStored();
    setThemeState(stored.theme);
    setLangState(stored.lang);
    setFontScaleState(stored.fontScale);
    setHydrated(true);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: "light" | "dark" =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.setProperty("--font-scale", String(fontScale));
    root.lang = lang;
  }, [resolvedTheme, fontScale, lang]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(KEY, JSON.stringify({ theme, lang, fontScale }));
  }, [hydrated, theme, lang, fontScale]);

  const t = useCallback((s: string) => (lang === "hi" ? (HI[s] ?? s) : s), [lang]);

  const value = useMemo<PrefsValue>(
    () => ({
      theme,
      setTheme: setThemeState,
      resolvedTheme,
      lang,
      setLang: setLangState,
      fontScale,
      setFontScale: setFontScaleState,
      t,
    }),
    [theme, resolvedTheme, lang, fontScale, t],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside <PreferencesProvider>");
  return ctx;
}

/** Convenience hook for translating a single string. */
export function useT() {
  return usePrefs().t;
}
