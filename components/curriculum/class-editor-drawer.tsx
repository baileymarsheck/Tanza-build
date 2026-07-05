"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useCurriculum } from "@/lib/curriculum";
import type { ClassRecord, ClassResource, ResourceKind } from "@/lib/types";

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

// Slide-over editor for a single class. Edits a local draft and only writes to
// the store on Save, so an admin can back out with Cancel/Escape.
export function ClassEditorDrawer({
  klass,
  onClose,
}: {
  klass: ClassRecord | null;
  onClose: () => void;
}) {
  const { updateClass } = useCurriculum();
  const [draft, setDraft] = useState<ClassRecord | null>(klass);

  useEffect(() => {
    setDraft(klass);
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

  function save() {
    if (!draft) return;
    updateClass(draft.id, {
      title: draft.title.trim() || "Untitled class",
      summary: draft.summary,
      notes: draft.notes,
      transcript: draft.transcript,
      resources: draft.resources.filter((r) => r.label.trim() || r.url.trim()),
    });
    onClose();
  }

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-40 bg-slate-900/30 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={draft ? `Edit ${draft.title}` : undefined}
        inert={!isOpen}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-200 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-brand-navy">Edit class</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close editor"
            className="flex size-8 items-center justify-center rounded-lg border border-slate-300 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </div>

        {draft && (
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
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

            <Field label="Notes" hint="Shown to fellows on the class page.">
              <textarea
                value={draft.notes}
                onChange={(e) => patch({ notes: e.target.value })}
                rows={6}
                className="input resize-y"
              />
            </Field>

            <Field label="Transcript">
              <textarea
                value={draft.transcript}
                onChange={(e) => patch({ transcript: e.target.value })}
                rows={5}
                className="input resize-y font-mono text-xs"
              />
            </Field>

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
        )}

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
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
    </>
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
