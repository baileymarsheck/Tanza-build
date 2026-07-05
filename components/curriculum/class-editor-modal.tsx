"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { useCurriculum } from "@/lib/curriculum";
import {
  datetimeLocalToIso,
  defaultScheduleIso,
  isoToDatetimeLocal,
} from "@/lib/class-availability";
import { uploadClassVideo } from "@/lib/supabase/storage";
import type {
  ClassRecord,
  ClassResource,
  ClassStatus,
  ClassVideo,
  ResourceKind,
} from "@/lib/types";

const RESOURCE_KINDS: ResourceKind[] = [
  "reading",
  "template",
  "toolkit",
  "slides",
  "link",
];

function makeResourceId() {
  return `res-${Math.random().toString(36).slice(2, 9)}`;
}

function makeVideoId() {
  return `vid-${Math.random().toString(36).slice(2, 9)}`;
}

// Full-screen modal editor for a single class. Edits a local draft and only
// writes to the store on Save, so an admin can back out with Cancel/Escape.
export function ClassEditorModal({
  klass,
  onClose,
}: {
  klass: ClassRecord | null;
  onClose: () => void;
}) {
  const { updateClass } = useCurriculum();
  const [draft, setDraft] = useState<ClassRecord | null>(klass);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(klass);
    setUploadError(null);
  }, [klass]);

  useEffect(() => {
    if (!klass) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [klass, onClose]);

  const isOpen = klass !== null && draft !== null;

  function patch(fields: Partial<ClassRecord>) {
    setDraft((d) => (d ? { ...d, ...fields } : d));
  }

  function updateResource(id: string, fields: Partial<ClassResource>) {
    setDraft((d) =>
      d
        ? {
            ...d,
            resources: d.resources.map((r) =>
              r.id === id ? { ...r, ...fields } : r
            ),
          }
        : d
    );
  }

  function addResource() {
    setDraft((d) =>
      d
        ? {
            ...d,
            resources: [
              ...d.resources,
              { id: makeResourceId(), label: "", url: "", kind: "link" },
            ],
          }
        : d
    );
  }

  function removeResource(id: string) {
    setDraft((d) =>
      d ? { ...d, resources: d.resources.filter((r) => r.id !== id) } : d
    );
  }

  function updateVideo(id: string, fields: Partial<ClassVideo>) {
    setDraft((d) =>
      d
        ? {
            ...d,
            videos: (d.videos ?? []).map((v) =>
              v.id === id ? { ...v, ...fields } : v
            ),
          }
        : d
    );
  }

  function addVideoByUrl() {
    setDraft((d) =>
      d
        ? {
            ...d,
            videos: [
              ...(d.videos ?? []),
              { id: makeVideoId(), title: "", url: "" },
            ],
          }
        : d
    );
  }

  function removeVideo(id: string) {
    setDraft((d) =>
      d ? { ...d, videos: (d.videos ?? []).filter((v) => v.id !== id) } : d
    );
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file || !draft) return;

    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadClassVideo(file, draft.id);
      setDraft((d) =>
        d
          ? {
              ...d,
              videos: [
                ...(d.videos ?? []),
                { id: makeVideoId(), title: file.name, url },
              ],
            }
          : d
      );
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  function setAvailabilityMode(mode: ClassStatus) {
    if (mode === "scheduled") {
      patch({
        status: "scheduled",
        releaseAt: draft?.releaseAt ?? defaultScheduleIso(),
      });
    } else {
      patch({ status: mode, releaseAt: null });
    }
  }

  function save() {
    if (!draft) return;
    // A "scheduled" class with no date falls back to locked.
    const scheduledWithoutDate =
      draft.status === "scheduled" && !draft.releaseAt;
    updateClass(draft.id, {
      title: draft.title.trim() || "Untitled class",
      summary: draft.summary,
      status: scheduledWithoutDate ? "locked" : draft.status,
      releaseAt: draft.status === "scheduled" ? draft.releaseAt : null,
      notes: draft.notes,
      transcript: draft.transcript,
      resources: draft.resources.filter((r) => r.label.trim() || r.url.trim()),
      videos: (draft.videos ?? []).filter((v) => v.url.trim()),
    });
    onClose();
  }

  return (
    <div
      inert={!isOpen}
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${
        isOpen ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {/* Scrim */}
      <div
        onClick={onClose}
        aria-hidden
        className="absolute inset-0 bg-slate-900/40"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={draft ? `Edit ${draft.title}` : undefined}
          className={`flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-transform duration-200 ease-out ${
            isOpen ? "scale-100" : "scale-95"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-brand-navy">
                Edit class
              </h2>
              {draft?.title && (
                <p className="text-sm text-slate-500">{draft.title}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close editor"
              className="flex size-9 items-center justify-center rounded-lg border border-slate-300 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <X size={18} />
            </button>
          </div>

          {draft && (
            <div className="grid flex-1 gap-x-8 gap-y-5 overflow-y-auto px-6 py-6 lg:grid-cols-2">
              {/* Left column: core fields */}
              <div className="space-y-5">
                <Field label="Title">
                  <input
                    value={draft.title}
                    onChange={(e) => patch({ title: e.target.value })}
                    className="input"
                  />
                </Field>

                <Field label="Summary" hint="One line shown in the class list.">
                  <input
                    value={draft.summary}
                    onChange={(e) => patch({ summary: e.target.value })}
                    className="input"
                  />
                </Field>

                <Field
                  label="Availability"
                  hint={
                    draft.status === "scheduled"
                      ? "Unlocks automatically at this time unless you toggle it manually first."
                      : "Or schedule it to unlock automatically at a set time."
                  }
                >
                  <select
                    value={draft.status}
                    onChange={(e) =>
                      setAvailabilityMode(e.target.value as ClassStatus)
                    }
                    className="input"
                  >
                    <option value="released">Released now</option>
                    <option value="locked">Locked</option>
                    <option value="scheduled">Scheduled…</option>
                  </select>
                  {draft.status === "scheduled" && (
                    <input
                      type="datetime-local"
                      value={isoToDatetimeLocal(draft.releaseAt)}
                      onChange={(e) =>
                        patch({ releaseAt: datetimeLocalToIso(e.target.value) })
                      }
                      className="input mt-2"
                    />
                  )}
                </Field>

                <Field label="Notes" hint="Shown to fellows on the class page.">
                  <textarea
                    value={draft.notes}
                    onChange={(e) => patch({ notes: e.target.value })}
                    rows={7}
                    className="input resize-y"
                  />
                </Field>

                <Field label="Transcript">
                  <textarea
                    value={draft.transcript}
                    onChange={(e) => patch({ transcript: e.target.value })}
                    rows={7}
                    className="input resize-y font-mono text-xs"
                  />
                </Field>
              </div>

              {/* Right column: media & resources */}
              <div className="space-y-5">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Videos
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={addVideoByUrl}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-navy hover:text-brand-orange"
                      >
                        <Plus size={15} />
                        Add URL
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-navy hover:text-brand-orange disabled:opacity-50"
                      >
                        <Upload size={15} />
                        {uploading ? "Uploading…" : "Upload"}
                      </button>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelected}
                    className="hidden"
                  />

                  {uploadError && (
                    <p className="mb-2 rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
                      {uploadError}
                    </p>
                  )}

                  <div className="space-y-2">
                    {(draft.videos ?? []).length === 0 && (
                      <p className="text-sm text-slate-400">
                        No videos yet. Upload a file (requires Supabase) or add a
                        video URL.
                      </p>
                    )}
                    {(draft.videos ?? []).map((v) => (
                      <div
                        key={v.id}
                        className="rounded-lg border border-slate-200 p-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            value={v.title}
                            onChange={(e) =>
                              updateVideo(v.id, { title: e.target.value })
                            }
                            placeholder="Title (e.g. Class recording)"
                            className="input flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => removeVideo(v.id)}
                            aria-label="Remove video"
                            className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <input
                          value={v.url}
                          onChange={(e) =>
                            updateVideo(v.id, { url: e.target.value })
                          }
                          placeholder="https://… (Supabase video URL)"
                          className="input mt-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Resources
                    </span>
                    <button
                      type="button"
                      onClick={addResource}
                      className="inline-flex items-center gap-1 text-sm font-medium text-brand-navy hover:text-brand-orange"
                    >
                      <Plus size={15} />
                      Add
                    </button>
                  </div>

                  <div className="space-y-2">
                    {draft.resources.length === 0 && (
                      <p className="text-sm text-slate-400">No resources yet.</p>
                    )}
                    {draft.resources.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-lg border border-slate-200 p-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            value={r.label}
                            onChange={(e) =>
                              updateResource(r.id, { label: e.target.value })
                            }
                            placeholder="Label"
                            className="input flex-1"
                          />
                          <select
                            value={r.kind}
                            onChange={(e) =>
                              updateResource(r.id, {
                                kind: e.target.value as ResourceKind,
                              })
                            }
                            className="input w-28 shrink-0"
                          >
                            {RESOURCE_KINDS.map((k) => (
                              <option key={k} value={k}>
                                {k}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeResource(r.id)}
                            aria-label="Remove resource"
                            className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <input
                          value={r.url}
                          onChange={(e) =>
                            updateResource(r.id, { url: e.target.value })
                          }
                          placeholder="https://…"
                          className="input mt-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}
