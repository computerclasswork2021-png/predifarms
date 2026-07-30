import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Plus, Trash2 } from "lucide-react";
import { useFarm } from "@/lib/farm-store";
import { Panel, Pill } from "@/components/app/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KINDS = ["irrigate", "spray", "nutrient", "labour", "market", "other"] as const;

/** Farmer-authored tasks, living beside the generated plan. */
export default function TaskBoard() {
  const { tasks, blocks, addTask, toggleTask, deleteTask } = useFarm();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [kind, setKind] = useState<string>("other");
  const [blockId, setBlockId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = title.trim();
    if (clean.length < 2) return;
    setBusy(true);
    try {
      await addTask({
        title: clean.slice(0, 140),
        kind,
        dueDate: due || null,
        blockId: blockId || null,
      });
      setTitle("");
      setDue("");
      setBlockId("");
      setKind("other");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">My own tasks</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {pending.length ? `${pending.length} still to do` : "Nothing pending"}
            {done.length ? ` · ${done.length} done` : ""}
          </p>
        </div>
        <Button size="sm" variant={open ? "secondary" : "default"} onClick={() => setOpen(!open)}>
          <Plus className={cn("size-4 transition-transform", open && "rotate-45")} />
          Add
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={submit}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-2.5 border-t border-border/60 pt-4">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Repair the east channel gate"
                maxLength={140}
              />
              <div className="flex flex-wrap gap-2">
                <Input
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  className="w-40"
                />
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
                >
                  {KINDS.map((k) => (
                    <option key={k} value={k} className="bg-surface-1">
                      {k}
                    </option>
                  ))}
                </select>
                <select
                  value={blockId}
                  onChange={(e) => setBlockId(e.target.value)}
                  className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
                >
                  <option value="" className="bg-surface-1">
                    Whole farm
                  </option>
                  {blocks.map((b) => (
                    <option key={b.id} value={b.id} className="bg-surface-1">
                      {b.name}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" disabled={busy || title.trim().length < 2}>
                  {busy ? "Saving…" : "Save task"}
                </Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {tasks.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {[...pending, ...done].map((t) => {
            const block = blocks.find((b) => b.id === t.block_id);
            return (
              <li
                key={t.id}
                className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-surface-1 px-3 py-2.5"
              >
                <button
                  onClick={() => toggleTask(t.id, t.done)}
                  aria-label={t.done ? "Mark as not done" : "Mark as done"}
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                    t.done ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {t.done && <Check className="size-3" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm", t.done && "text-muted-foreground line-through")}>
                    {t.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {[block?.name ?? "Whole farm", t.kind, t.due_date ?? "no date"].join(" · ")}
                  </p>
                </div>
                {!t.done && t.due_date && new Date(`${t.due_date}T23:59:59`) < new Date() && (
                  <Pill tone="warn">overdue</Pill>
                )}
                <button
                  onClick={() => deleteTask(t.id)}
                  aria-label="Delete task"
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
