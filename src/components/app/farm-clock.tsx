import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { usePrefs } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Live farm clock — ticks every second, formatted for the chosen language. */
export default function FarmClock({
  className,
  showDate = true,
}: {
  className?: string;
  showDate?: boolean;
}) {
  const { lang, t } = usePrefs();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const locale = lang === "hi" ? "hi-IN" : "en-IN";
  const time = now
    ? now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "--:--:--";
  const date = now
    ? now.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })
    : "";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Clock className="size-4 shrink-0 text-primary" aria-hidden />
      <span className="min-w-0">
        <span
          className="type-numeral block text-sm leading-none tabular-nums"
          aria-label={t("Local farm time")}
        >
          {time}
        </span>
        {showDate && date && (
          <span className="mt-1 block truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {date}
          </span>
        )}
      </span>
    </div>
  );
}
