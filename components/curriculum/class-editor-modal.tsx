"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useCurriculum } from "@/lib/curriculum";
import { useAssessments } from "@/lib/assessments";
import {
  guessResourceKind,
  uploadClassResource,
  uploadClassVideo,
} from "@/lib/supabase/storage";
import { EditorModal } from "@/components/modal";
import { AvailabilityField } from "@/components/availability-field";
import { AssessmentEditorModal } from "@/components/assessments/assessment-editor-modal";
import { StatusPill } from "@/components/curriculum/status-pill";
import type {
  AssessmentRecord,
  ClassRecord,
  ClassResource,
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
  onDelete,
}: {
  klass: ClassRecord | null;
  onClose: () => void;
  onDelete: () => void;
}) {
  const { updateClass } = useCurriculum();
  const { getAssessmentsForClass, addAssessment, deleteAssessment } =
    useAssessments();
  const [draft, setDraft] = useState<ClassRecord | null>(klass);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingResource, setUploadingResource] = useState(false);
  const [resourceUploadError, setResourceUploadError] = useState<
    string | null
  >(null);
  const resourceFileInputRef = useRef<HTMLInputElement>(null);
  const [editingAssessment, setEditingAssessment] =
    useState<AssessmentRecord | null>(null);

  useEffect(() => {
    setDraft(klass);
    setVideoUploadError(null);
    setResourceUploadError(null);
  }, [klass]);

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

  async function handleVideoFileSelected(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file || !draft) return;

    setUploadingVideo(true);
    setVideoUploadError(null);
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
      setVideoUploadError(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
    } finally {
      setUploadingVideo(false);
    }
  }

  async function handleResourceFileSelected(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file || !draft) return;

    setUploadingResource(true);
    setResourceUploadError(null);
    try {
      const url = await uploadClassResource(file, draft.id);
      // Strip the extension for a cleaner default label (e.g. "Handbook.pdf" -> "Handbook").
      const label = file.name.replace(/\.[^./]+$/, "");
      setDraft((d) =>
        d
          ? {
              ...d,
              resources: [
                ...d.resources,
                {
                  id: makeResourceId(),
                  label,
                  url,
                  kind: guessResourceKind(file.name),
                },
              ],
            }
          : d
      );
    } catch (err) {
      setResourceUploadError(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
    } finally {
      setUploadingResource(false);
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
    <>
      <EditorModal
        isOpen={isOpen}
        onClose={onClose}
        title="Edit class"
        subtitle={draft?.title}
        ariaLabel={draft ? `Edit ${draft.title}` : undefined}
        maxWidthClassName="max-w-5xl"
      >
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
                  <AvailabilityField
                    status={draft.status}
                    releaseAt={draft.releaseAt}
                    onChange={(next) => patch(next)}
                  />
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
                        onClick={() => videoFileInputRef.current?.click()}
                        disabled={uploadingVideo}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-navy hover:text-brand-orange disabled:opacity-50"
                      >
                        <Upload size={15} />
                        {uploadingVideo ? "Uploading…" : "Upload"}
                      </button>
                    </div>
                  </div>

                  <input
                    ref={videoFileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileSelected}
                    className="hidden"
                  />

                  {videoUploadError && (
                    <p className="mb-2 rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
                      {videoUploadError}
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
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={addResource}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-navy hover:text-brand-orange"
                      >
                        <Plus size={15} />
                        Add URL
                      </button>
                      <button
                        type="button"
                        onClick={() => resourceFileInputRef.current?.click()}
                        disabled={uploadingResource}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-navy hover:text-brand-orange disabled:opacity-50"
                      >
                        <Upload size={15} />
                        {uploadingResource ? "Uploading…" : "Upload"}
                      </button>
                    </div>
                  </div>

                  <input
                    ref={resourceFileInputRef}
                    type="file"
                    onChange={handleResourceFileSelected}
                    className="hidden"
                  />

                  {resourceUploadError && (
                    <p className="mb-2 rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
                      {resourceUploadError}
                    </p>
                  )}

                  <div className="space-y-2">
                    {draft.resources.length === 0 && (
                      <p className="text-sm text-slate-400">
                        No resources yet. Upload a file (requires Supabase) or
                        add a URL.
                      </p>
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

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Assessments
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingAssessment(addAssessment(draft.id))}
                      className="inline-flex items-center gap-1 text-sm font-medium text-brand-navy hover:text-brand-orange"
                    >
                      <Plus size={15} />
                      Add assessment
                    </button>
                  </div>

                  <div className="space-y-2">
                    {getAssessmentsForClass(draft.id).length === 0 && (
                      <p className="text-sm text-slate-400">
                        No assessments yet for this class.
                      </p>
                    )}
                    {getAssessmentsForClass(draft.id).map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-slate-800">
                              {a.title}
                            </span>
                            <StatusPill item={a} />
                          </div>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {a.questionIds.length} question
                            {a.questionIds.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingAssessment(a)}
                          aria-label={`Edit ${a.title}`}
                          className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAssessment(a.id)}
                          aria-label={`Delete ${a.title}`}
                          className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 size={15} />
            Delete class
          </button>
          <div className="flex items-center gap-2">
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
      </EditorModal>

      <AssessmentEditorModal
        assessment={editingAssessment}
        onClose={() => setEditingAssessment(null)}
      />
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
