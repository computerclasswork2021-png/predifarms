import { Languages, Monitor, Moon, Sun } from "lucide-react";
import { usePrefs, type ThemeMode } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const THEMES: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

export function ThemeSwitch({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, resolvedTheme, t } = usePrefs();

  if (compact) {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    const Icon = resolvedTheme === "dark" ? Sun : Moon;
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        aria-label={t(next === "dark" ? "Dark" : "Light")}
        className="grid size-9 min-h-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <Icon className="size-4" />
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label={t("Theme")}
      className="inline-flex rounded-full border border-glass-border bg-surface-2 p-1"
    >
      {THEMES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={theme === id}
          onClick={() => setTheme(id)}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
            theme === id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-4" />
          {t(label)}
        </button>
      ))}
    </div>
  );
}

export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = usePrefs();

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setLang(lang === "en" ? "hi" : "en")}
        aria-label={t("Language")}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <Languages className="size-4" />
        {lang === "en" ? "EN" : "हि"}
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label={t("Language")}
      className="inline-flex rounded-full border border-glass-border bg-surface-2 p-1"
    >
      {(
        [
          ["en", "English"],
          ["hi", "Hindi"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={lang === id}
          onClick={() => setLang(id)}
          className={cn(
            "min-h-11 rounded-full px-5 text-sm font-medium transition-colors",
            lang === id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(label)}
        </button>
      ))}
    </div>
  );
}

const SIZES: { value: number; label: string }[] = [
  { value: 0.9, label: "Small" },
  { value: 1, label: "Normal" },
  { value: 1.15, label: "Large" },
  { value: 1.3, label: "Extra large" },
];

export function FontSizeSwitch() {
  const { fontScale, setFontScale, t } = usePrefs();
  return (
    <div
      role="radiogroup"
      aria-label={t("Text size")}
      className="inline-flex flex-wrap gap-1 rounded-2xl border border-glass-border bg-surface-2 p-1"
    >
      {SIZES.map(({ value, label }) => (
        <button
          key={label}
          type="button"
          role="radio"
          aria-checked={Math.abs(fontScale - value) < 0.01}
          onClick={() => setFontScale(value)}
          style={{ fontSize: `${0.75 + (value - 0.9) * 0.9}rem` }}
          className={cn(
            "min-h-11 rounded-xl px-4 font-medium transition-colors",
            Math.abs(fontScale - value) < 0.01
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(label)}
        </button>
      ))}
    </div>
  );
}
