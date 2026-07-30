import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileUp, Loader2, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { analyzeUpload, type AnalysisResult } from "@/lib/analysis.functions";
import { GhostButton, Meter, Panel, Pill, PrimaryButton, SectionHeading } from "@/components/app/primitives";

type Attachment = { name: string; mimeType: string; dataUrl: string; size: number };

const MAX_BYTES = 8 * 1024 * 1024;

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

export function UploadAnalyzer({
  kind,
  accept,
  title,
  hint,
  context,
  contextPlaceholder,
}: {
  kind: "soil" | "disease";
  accept: string;
  title: string;
  hint: string;
  context?: string;
  contextPlaceholder: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<Attachment[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const run = useServerFn(analyzeUpload);

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const next: Attachment[] = [];
    for (const file of Array.from(list).slice(0, 4)) {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 8 MB.`);
        continue;
      }
      next.push({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        dataUrl: await readAsDataUrl(file),
        size: file.size,
      });
    }
    setFiles((prev) => [...prev, ...next].slice(0, 4));
  }

  async function analyze() {
    if (!files.length) {
      toast.error("Add at least one file first.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const output = await run({
        data: {
          kind,
          files: files.map(({ name, mimeType, dataUrl }) => ({ name, mimeType, dataUrl })),
          context: [context, notes].filter(Boolean).join(" — ") || undefined,
        },
      });
      setResult(output);
      toast.success("Analysis ready");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Panel className="p-5">
        <SectionHeading title={title} hint={hint} icon={Upload} />

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          className="grid cursor-pointer place-items-center rounded-2xl border border-dashed border-glass-border bg-surface-2/50 px-6 py-10 text-center transition-colors hover:border-primary/50"
        >
          <FileUp className="size-7 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">Drop files here, or click to browse</p>
          <p className="mt-1 text-xs text-muted-foreground">Up to 4 files, 8 MB each.</p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={(e) => {
              void addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {files.length > 0 && (
          <ul className="mt-4 space-y-2">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-glass-border bg-surface-2 p-2">
                {f.mimeType.startsWith("image/") ? (
                  <img src={f.dataUrl} alt={f.name} className="size-12 rounded-lg object-cover" />
                ) : (
                  <span className="grid size-12 place-items-center rounded-lg bg-surface-1 text-muted-foreground">
                    <FileUp className="size-5" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">{f.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="rounded-lg p-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <label className="mt-4 block text-xs font-medium text-muted-foreground">
          Anything the AI should know?
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={contextPlaceholder}
            className="mt-1.5 w-full resize-none rounded-xl border border-glass-border bg-surface-2 p-3 text-sm text-foreground"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <PrimaryButton onClick={() => void analyze()} disabled={loading || files.length === 0}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? "Analysing…" : "Analyse with AI"}
          </PrimaryButton>
          <GhostButton
            onClick={() => {
              setFiles([]);
              setResult(null);
              setNotes("");
            }}
          >
            Clear
          </GhostButton>
        </div>
      </Panel>

      {result && (
        <Panel className="p-5">
          <SectionHeading title={result.title} hint={`Model confidence ${result.confidence}%`} icon={CheckCircle2} />
          <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
          <Meter className="mt-3" value={result.confidence} tone={result.confidence >= 70 ? "good" : "warn"} />

          {result.findings.length > 0 && (
            <ul className="mt-5 space-y-3">
              {result.findings.map((f) => (
                <li key={f.label} className="rounded-xl border border-glass-border bg-surface-2/60 p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold">{f.label}</span>
                    <Pill tone={f.status === "good" ? "good" : f.status === "critical" ? "bad" : "warn"}>{f.value}</Pill>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.note}</p>
                </li>
              ))}
            </ul>
          )}

          {result.actions.length > 0 && (
            <div className="mt-5 border-t border-border/60 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">What to do</p>
              <ol className="space-y-3">
                {result.actions.map((a, i) => (
                  <li key={`${a.action}-${i}`} className="text-sm">
                    <span className="font-medium">{a.action}</span>
                    <span className="ml-2 font-mono text-[11px] text-primary">{a.timing}</span>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.why}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {result.cautions.length > 0 && (
            <ul className="mt-4 space-y-2">
              {result.cautions.map((c, i) => (
                <li key={i} className="rounded-xl border border-amber/25 bg-amber/8 p-3 text-xs leading-relaxed text-amber">
                  <AlertTriangle className="mr-1.5 inline size-3.5" />
                  {c}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </div>
  );
}
