"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useAssessments } from "@/lib/assessments";
import type { Aptitude, Question, QuestionOption, QuestionType } from "@/lib/types";

function makeOptionId() {
  return `opt-${Math.random().toString(36).slice(2, 9)}`;
}

const APTITUDES: { key: Aptitude; label: string }[] = [
  { key: "technical", label: "Technical" },
  { key: "strategic", label: "Strategic" },
  { key: "leadership", label: "Leadership" },
];

// Full-screen modal editor for a single question in the shared bank. Same
// chrome/draft pattern as ClassEditorModal, single-column since it's one form.
export function QuestionEditorModal({
  question,
  onClose,
}: {
  question: Question | null;
  onClose: () => void;
}) {
  const { updateQuestion } = useAssessments();
  const [draft, setDraft] = useState<Question | null>(question);
  const [tagsText, setTagsText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(question);
    setTagsText(question?.tags.join(", ") ?? "");
    setError(null);
  }, [question]);

  useEffect(() => {
    if (!question) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [question, onClose]);

  const isOpen = question !== null && draft !== null;

  function patch(fields: Partial<Question>) {
    setDraft((d) => (d ? { ...d, ...fields } : d));
  }

  function updateOption(id: string, fields: Partial<QuestionOption>) {
    setDraft((d) =>
      d ? { ...d, options: d.options.map((o) => (o.id === id ? { ...o, ...fields } : o)) } : d
    );
  }

  function setCorrectOption(id: string) {
    setDraft((d) =>
      d ? { ...d, options: d.options.map((o) => ({ ...o, correct: o.id === id })) } : d
    );
  }

  function addOption() {
    setDraft((d) =>
      d ? { ...d, options: [...d.options, { id: makeOptionId(), text: "", correct: false }] } : d
    );
  }

  function removeOption(id: string) {
    setDraft((d) => (d ? { ...d, options: d.options.filter((o) => o.id !== id) } : d));
  }

  function setType(type: QuestionType) {
    patch({ type, options: type === "multiple-choice" ? draft?.options ?? [] : [] });
  }

  const weightSum = draft
    ? APTITUDES.reduce((sum, a) => sum + (draft.aptitudeWeights[a.key] ?? 0), 0)
    : 0;

  function save() {
    if (!draft) return;

    if (draft.type === "multiple-choice") {
      if (draft.options.length < 2) {
        setError("Add at least 2 options.");
        return;
      }
      if (draft.options.filter((o) => o.correct).length !== 1) {
        setError("Mark exactly one option as correct.");
        return;
      }
    }

    updateQuestion(draft.id, {
      prompt: draft.prompt.trim(),
      type: draft.type,
      options: draft.options,
      points: draft.points,
      aptitudeWeights: draft.aptitudeWeights,
      tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
    });
    onClose();
  }

  return (
    <div
      inert={!isOpen}
      className={`fixed inset-0 z-[70] transition-opacity duration-200 ${
        isOpen ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div onClick={onClose} aria-hidden className="absolute inset-0 bg-slate-900/40" />

      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit question"
          className={`flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-transform duration-200 ease-out ${
            isOpen ? "scale-100" : "scale-95"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-brand-navy">Edit question</h2>
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
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <Field label="Type">
                <select
                  value={draft.type}
                  onChange={(e) => setType(e.target.value as QuestionType)}
                  className="input"
                >
                  <option value="multiple-choice">Multiple choice</option>
                  <option value="short-answer">Short answer</option>
                </select>
              </Field>

              <Field label="Prompt">
                <textarea
                  value={draft.prompt}
                  onChange={(e) => patch({ prompt: e.target.value })}
                  rows={3}
                  className="input resize-y"
                />
              </Field>

              <Field label="Points" hint="Max points this question is worth.">
                <input
                  type="number"
                  min={1}
                  value={draft.points}
                  onChange={(e) => patch({ points: Number(e.target.value) || 1 })}
                  className="input w-24"
                />
              </Field>

              <Field
                label="Tags"
                hint="Comma-separated competency/behaviour tags, e.g. data-diagnosis."
              >
                <input
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  className="input"
                />
              </Field>

              <Field
                label="Aptitude weights"
                hint="Percent of this question's weighting against each aptitude."
              >
                <div className="flex items-center gap-3">
                  {APTITUDES.map((a) => (
                    <label key={a.key} className="flex items-center gap-1.5 text-sm">
                      <span className="text-slate-600">{a.label}</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={draft.aptitudeWeights[a.key] ?? 0}
                        onChange={(e) =>
                          patch({
                            aptitudeWeights: {
                              ...draft.aptitudeWeights,
                              [a.key]: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="input w-16"
                      />
                      <span className="text-slate-400">%</span>
                    </label>
                  ))}
                  <span
                    className={`ml-1 text-xs font-medium ${
                      weightSum === 100 ? "text-slate-400" : "text-red-600"
                    }`}
                  >
                    {weightSum}% total
                  </span>
                </div>
              </Field>

              {draft.type === "multiple-choice" && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Options{" "}
                      <span className="font-normal text-slate-400">
                        (mark the correct one)
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={addOption}
                      className="inline-flex items-center gap-1 text-sm font-medium text-brand-navy hover:text-brand-orange"
                    >
                      <Plus size={15} />
                      Add option
                    </button>
                  </div>

                  <div className="space-y-2">
                    {draft.options.map((o) => (
                      <div key={o.id} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${draft.id}`}
                          checked={o.correct}
                          onChange={() => setCorrectOption(o.id)}
                          aria-label="Correct option"
                          className="size-4 shrink-0 accent-brand-orange"
                        />
                        <input
                          value={o.text}
                          onChange={(e) => updateOption(o.id, { text: e.target.value })}
                          placeholder="Option text"
                          className="input flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(o.id)}
                          aria-label="Remove option"
                          className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p className="rounded-md bg-red-50 px-2.5 py-1.5 text-sm text-red-700">
                  {error}
                </p>
              )}
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
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}
