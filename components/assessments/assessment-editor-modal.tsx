"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useAssessments } from "@/lib/assessments";
import { EditorModal } from "@/components/modal";
import { AvailabilityField } from "@/components/availability-field";
import type { AssessmentRecord } from "@/lib/types";

// Full-screen modal editor for a single assessment: title/description,
// availability, and an ordered subset of the shared question bank. Same
// draft/save/Escape pattern as ClassEditorModal and QuestionEditorModal.
export function AssessmentEditorModal({
  assessment,
  onClose,
}: {
  assessment: AssessmentRecord | null;
  onClose: () => void;
}) {
  const { questions, updateAssessment } = useAssessments();
  const [draft, setDraft] = useState<AssessmentRecord | null>(assessment);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setDraft(assessment);
    setSearch("");
  }, [assessment]);

  const isOpen = assessment !== null && draft !== null;

  function patch(fields: Partial<AssessmentRecord>) {
    setDraft((d) => (d ? { ...d, ...fields } : d));
  }

  function addQuestionToDraft(questionId: string) {
    setDraft((d) =>
      d && !d.questionIds.includes(questionId)
        ? { ...d, questionIds: [...d.questionIds, questionId] }
        : d
    );
  }

  function removeQuestionFromDraft(questionId: string) {
    setDraft((d) =>
      d ? { ...d, questionIds: d.questionIds.filter((id) => id !== questionId) } : d
    );
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    setDraft((d) => {
      if (!d) return d;
      const next = [...d.questionIds];
      const target = index + direction;
      if (target < 0 || target >= next.length) return d;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...d, questionIds: next };
    });
  }

  function save() {
    if (!draft) return;
    updateAssessment(draft.id, {
      title: draft.title.trim() || "Untitled assessment",
      description: draft.description,
      status: draft.status,
      releaseAt: draft.status === "scheduled" ? draft.releaseAt : null,
      questionIds: draft.questionIds,
    });
    onClose();
  }

  const attached = (draft?.questionIds ?? [])
    .map((id) => questions.find((q) => q.id === id))
    .filter((q): q is NonNullable<typeof q> => !!q);

  const searchResults = draft
    ? questions
        .filter((q) => !draft.questionIds.includes(q.id))
        .filter((q) => {
          if (!search.trim()) return false;
          const s = search.toLowerCase();
          return (
            q.prompt.toLowerCase().includes(s) ||
            q.tags.some((t) => t.toLowerCase().includes(s))
          );
        })
        .slice(0, 8)
    : [];

  return (
    <EditorModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit assessment"
      subtitle={draft?.title}
      ariaLabel={draft ? `Edit ${draft.title}` : undefined}
      zIndexClassName="z-[60]"
    >
      {draft && (
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <Field label="Title">
                <input
                  value={draft.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  className="input"
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={draft.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  rows={3}
                  className="input resize-y"
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

              <div>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Questions ({attached.length})
                </span>

                <div className="space-y-2">
                  {attached.length === 0 && (
                    <p className="text-sm text-slate-400">
                      No questions attached yet — search the bank below.
                    </p>
                  )}
                  {attached.map((q, i) => (
                    <div
                      key={q.id}
                      className="flex items-start gap-2 rounded-lg border border-slate-200 p-2.5"
                    >
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => moveQuestion(i, -1)}
                          disabled={i === 0}
                          aria-label="Move up"
                          className="text-slate-400 hover:text-brand-navy disabled:opacity-30"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveQuestion(i, 1)}
                          disabled={i === attached.length - 1}
                          aria-label="Move down"
                          className="text-slate-400 hover:text-brand-navy disabled:opacity-30"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {q.prompt}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {q.type === "multiple-choice" ? "Multiple choice" : "Short answer"} ·{" "}
                          {q.points} pt{q.points === 1 ? "" : "s"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestionFromDraft(q.id)}
                        aria-label="Remove question"
                        className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-3">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search the question bank by prompt or tag…"
                    className="input"
                  />
                  {search.trim() && (
                    <div className="mt-2 space-y-1.5">
                      {searchResults.length === 0 && (
                        <p className="text-sm text-slate-400">No matches.</p>
                      )}
                      {searchResults.map((q) => (
                        <div
                          key={q.id}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 p-2"
                        >
                          <p className="min-w-0 flex-1 truncate text-sm text-slate-700">
                            {q.prompt}
                          </p>
                          <button
                            type="button"
                            onClick={() => addQuestionToDraft(q.id)}
                            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-navy hover:text-brand-orange"
                          >
                            <Plus size={14} />
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
    </EditorModal>
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
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}
