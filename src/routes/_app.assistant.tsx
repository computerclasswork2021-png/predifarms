import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send } from "lucide-react";
import { useFarm } from "@/lib/farm-store";
import { nextSprayWindow } from "@/lib/farm";
import {
  GhostButton,
  PageBody,
  Panel,
  PhotoHero,
  PrimaryButton,
} from "@/components/app/primitives";
import { RESEARCH_TABLET } from "@/lib/photography";

export const Route = createFileRoute("/_app/assistant")({
  head: () => ({
    meta: [
      { title: "Ask PREDI — PREDI-FARM X" },
      {
        name: "description",
        content:
          "Ask questions about your own farm and get answers grounded in your blocks, stages and forecast.",
      },
      { property: "og:title", content: "Ask PREDI — PREDI-FARM X" },
      {
        property: "og:description",
        content:
          "Ask questions about your own farm and get answers grounded in your blocks, stages and forecast.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

interface Msg {
  id: string;
  role: "user" | "predi";
  text: string;
}

function Page() {
  const { blocks, cropStateFor, openPlan, forecast } = useFarm();
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: "seed",
      role: "predi",
      text: `You have ${blocks.length} blocks and ${openPlan.length} open tasks. Ask me about any of them — I only answer from your own data.`,
    },
  ]);
  const [draft, setDraft] = useState("");

  function answer(q: string): string {
    const lower = q.toLowerCase();
    if (lower.includes("spray")) {
      const w = nextSprayWindow(forecast);
      return w
        ? `Spray on ${w.label} — ${w.rainMm} mm rain and ${w.windKph} kph wind. Avoid the days either side.`
        : "There is no dry, low-wind day in the next seven days. Hold the spray rather than wasting the chemical.";
    }
    if (lower.includes("harvest")) {
      const s = blocks
        .map((b) => cropStateFor(b.id))
        .filter(Boolean)
        .sort((a, b) => a!.daysToHarvest - b!.daysToHarvest)[0];
      return s
        ? `${s.crop.label} is closest — ${s.daysToHarvest} days out, currently at ${s.stage.name.toLowerCase()}.`
        : "Nothing is close to harvest right now.";
    }
    if (lower.includes("water") || lower.includes("irrig")) {
      const dry = blocks.filter((b) => b.soil.moisture < 45);
      return dry.length
        ? `${dry.map((b) => b.name).join(", ")} ${dry.length === 1 ? "is" : "are"} below the comfortable moisture band. Check the forecast first — rain may cover it.`
        : "Every block is inside its moisture band. No irrigation needed today.";
    }
    const first = openPlan[0];
    return first
      ? `The most urgent thing on your farm is: ${first.title}. ${first.because}`
      : "Nothing is pending. Your fields are in good shape today.";
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    const q = draft.trim();
    if (!q) return;
    setMsgs((m) => [
      ...m,
      { id: `u${Date.now()}`, role: "user", text: q },
      { id: `p${Date.now()}`, role: "predi", text: answer(q) },
    ]);
    setDraft("");
  }

  return (
    <>
      <PhotoHero
        photo={RESEARCH_TABLET}
        eyebrow="Assistant"
        title="Ask about your farm, not about farming in general"
        lede="Every answer is drawn from your blocks, their stages and the seven-day forecast. If PREDI does not know, it says so instead of guessing."
      />

      <PageBody>
        <Panel className="flex h-[62vh] flex-col p-5">
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {msgs.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary/15 p-3 text-sm"
                    : "mr-auto max-w-[85%] rounded-2xl rounded-bl-sm border border-border/60 bg-surface-2/60 p-3 text-sm leading-relaxed"
                }
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["When can I spray?", "What needs water?", "When is harvest?"].map((s) => (
              <GhostButton key={s} onClick={() => setDraft(s)}>
                {s}
              </GhostButton>
            ))}
          </div>
          <form onSubmit={send} className="mt-3 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about a block, a task or the weather"
              aria-label="Ask PREDI a question"
              className="min-h-11 flex-1 rounded-xl border border-glass-border bg-surface-2 px-3 text-sm text-foreground placeholder:text-muted-foreground"
            />
            <PrimaryButton type="submit">
              <Send className="size-4" /> Ask
            </PrimaryButton>
          </form>
        </Panel>
      </PageBody>
    </>
  );
}
