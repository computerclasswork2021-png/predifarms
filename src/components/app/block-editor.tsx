import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CROP_LIST, type CropId } from "@/lib/farm";
import { IRRIGATION_METHODS, SOIL_TYPES } from "@/lib/db";
import { cropPhoto } from "@/lib/photography";
import { useFarm, type NewBlock } from "@/lib/farm-store";
import { cn } from "@/lib/utils";

/**
 * BlockEditor — a full-screen drawer for adding or editing a land block.
 * Lets the farmer name the block, assign a crop, set the sowing date,
 * choose an irrigation method, and pick a cover photo.
 */
export default function BlockEditor({
  open,
  onClose,
  blockId,
}: {
  open: boolean;
  onClose: () => void;
  blockId?: string | null;
}) {
  const { blocks, addBlock, updateBlock, removeBlock, farm } = useFarm();
  const editing = blockId ? blocks.find((b) => b.id === blockId) : null;

  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [soilType, setSoilType] = useState(SOIL_TYPES[0]);
  const [crop, setCrop] = useState<string>("");
  const [sowingDate, setSowingDate] = useState("");
  const [irrigation, setIrrigation] = useState<string>("rainfed");
  const [photoUrl, setPhotoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setArea(String(editing.areaHa));
      setSoilType(editing.soilType);
      setCrop(editing.crop ?? "");
      setSowingDate(editing.sownDaysAgo != null ? sowingDateFor(editing.sownDaysAgo) : "");
      setIrrigation(editing.irrigationMethod);
      setPhotoUrl(editing.photoUrl ?? "");
    } else {
      setName(`Block ${String.fromCharCode(65 + blocks.length)}`);
      setArea("");
      setSoilType(SOIL_TYPES[0]);
      setCrop("");
      setSowingDate("");
      setIrrigation("rainfed");
      setPhotoUrl("");
    }
    setError(null);
    setConfirmDelete(false);
  }, [open, editing, blocks.length]);

  function sowingDateFor(daysAgo: number) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  }

  async function save() {
    const cleanName = name.trim();
    const areaNum = Number(area);
    if (cleanName.length < 2) {
      setError("Give the block a name.");
      return;
    }
    if (!Number.isFinite(areaNum) || areaNum <= 0) {
      setError("Enter a positive area.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload: NewBlock = {
        name: cleanName,
        areaHa: Math.round(areaNum * 100) / 100,
        soilType,
        crop: crop || null,
        sowingDate: sowingDate || null,
        irrigationMethod: irrigation,
        photoUrl: photoUrl.trim() || null,
      };
      if (editing) {
        await updateBlock(editing.id, {
          name: payload.name,
          area_ha: payload.areaHa,
          soil_type: payload.soilType,
          crop: payload.crop,
          sowing_date: payload.sowingDate,
          irrigation_method: payload.irrigationMethod,
          photo_url: payload.photoUrl,
        });
      } else {
        await addBlock(payload);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the block.");
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    if (!editing) return;
    setBusy(true);
    try {
      await removeBlock(editing.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the block.");
    } finally {
      setBusy(false);
    }
  }

  const previewPhoto = cropPhoto(crop || null);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-background shadow-2xl"
          >
            {/* Header with live photo preview */}
            <div className="relative h-40 overflow-hidden">
              <img
                src={photoUrl || previewPhoto.url}
                alt={previewPhoto.alt}
                className="h-full w-full object-cover"
                style={{ objectPosition: previewPhoto.position }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.08_0.02_155/0.2),oklch(0.08_0.02_155/0.85))]" />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                <p className="type-eyebrow text-primary-foreground/85">
                  {editing ? "Edit block" : "New block"}
                </p>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="grid size-9 place-items-center rounded-full bg-background/40 text-primary-foreground backdrop-blur-md transition-colors hover:bg-background/60"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-lg font-semibold text-primary-foreground">
                  {name || "Untitled block"}
                </p>
                <p className="text-xs text-primary-foreground/70">
                  {area ? `${area} ha` : "—"} · {soilType} · {irrigation}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              <Field label="Block name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Block E, Lower patch"
                  maxLength={60}
                  className="input"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Area (ha)">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. 4.5"
                    className="input"
                  />
                </Field>
                <Field label="Soil type">
                  <select value={soilType} onChange={(e) => setSoilType(e.target.value)} className="input">
                    {SOIL_TYPES.map((s) => (
                      <option key={s} value={s} className="bg-surface-1">
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Crop (leave empty for fallow)">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCrop("")}
                    className={cn(
                      "chip",
                      !crop ? "chip-active" : "chip-idle",
                    )}
                  >
                    Fallow
                  </button>
                  {CROP_LIST.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCrop(c.id)}
                      className={cn("chip", crop === c.id ? "chip-active" : "chip-idle")}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Sowing date">
                  <input
                    type="date"
                    value={sowingDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setSowingDate(e.target.value)}
                    className="input"
                    disabled={!crop}
                  />
                </Field>
                <Field label="Irrigation method">
                  <select value={irrigation} onChange={(e) => setIrrigation(e.target.value)} className="input">
                    {IRRIGATION_METHODS.map((m) => (
                      <option key={m} value={m} className="bg-surface-1">
                        {m[0].toUpperCase() + m.slice(1)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Cover photo URL (optional)">
                <input
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="Paste an image link, or leave blank for a crop default"
                  className="input"
                />
              </Field>

              {error && (
                <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              {editing && (
                <div className="border-t border-border/60 pt-4">
                  {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-2 text-sm text-destructive/80 transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-4" /> Delete this block
                </button>
                  ) : (
                    <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3">
                      <p className="text-sm text-destructive">
                        Deleting removes the block and all its tasks. This cannot be undone.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={doDelete}
                          disabled={busy}
                          className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground"
                        >
                          Delete forever
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="rounded-lg border border-border px-4 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-border/60 p-4">
              <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Plus className="size-4" />
                {editing ? "Save changes" : "Add block"}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
