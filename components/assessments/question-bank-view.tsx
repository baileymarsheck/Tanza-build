"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAssessments } from "@/lib/assessments";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { QuestionEditorModal } from "@/components/assessments/question-editor-modal";
import type { Question } from "@/lib/types";

function makeOptionId() {
  return `opt-${Math.random().toString(36).slice(2, 9)}`;
}

// The shared question bank, as its own standalone view — lives at
// /assessments/questions (opened in a new tab from the Assessments page)
// since the list can get long and doesn't need to compete with the
// per-class assessments list on the same page.
export function QuestionBankView() {
  const { questions, addQuestion, deleteQuestion, isQuestionInUse } =
    useAssessments();
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Question | null>(null);

  function handleAddQuestion() {
    const question = addQuestion({
      type: "multiple-choice",
      prompt: "",
      options: [
        { id: makeOptionId(), text: "", correct: false },
        { id: makeOptionId(), text: "", correct: false },
      ],
      points: 1,
      aptitudeWeights: {},
      tags: [],
    });
    setEditingQuestion(question);
  }

  function handleDeleteRequest(question: Question) {
    if (isQuestionInUse(question.id).length > 0) {
      setDeleteCandidate(question);
    } else {
      deleteQuestion(question.id);
    }
  }

  const inUseAssessments = deleteCandidate ? isQuestionInUse(deleteCandidate.id) : [];

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-brand-navy">Question Bank</h2>
          <p className="mt-1 text-sm text-slate-600">
            Reusable questions, taggable to aptitudes and competencies. Attach
            them to any assessment from the class editor.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddQuestion}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <Plus size={15} />
          Add question
        </button>
      </div>

      <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {questions.length === 0 && (
          <li className="px-5 py-4 text-sm text-slate-400">No questions yet.</li>
        )}
        {questions.map((q) => {
          const weightSummary = (["technical", "strategic", "leadership"] as const)
            .map((a) => ({ a, w: q.aptitudeWeights[a] }))
            .filter((x) => x.w)
            .map((x) => `${x.w}% ${x.a[0].toUpperCase()}${x.a.slice(1)}`)
            .join(" · ");

          return (
            <li key={q.id} className="flex items-start gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {q.prompt || "Untitled question"}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {q.type === "multiple-choice" ? "Multiple choice" : "Short answer"}
                  {weightSummary ? ` · ${weightSummary}` : ""}
                  {q.tags.length > 0 ? ` · ${q.tags.join(", ")}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingQuestion(q)}
                aria-label="Edit question"
                className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteRequest(q)}
                aria-label="Delete question"
                className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </li>
          );
        })}
      </ul>

      <QuestionEditorModal
        question={editingQuestion}
        onClose={() => setEditingQuestion(null)}
      />

      <ConfirmDialog
        open={deleteCandidate !== null}
        title="Delete this question?"
        message={
          deleteCandidate
            ? `"${deleteCandidate.prompt || "This question"}" is used in ${inUseAssessments.length} assessment${
                inUseAssessments.length === 1 ? "" : "s"
              }: ${inUseAssessments.map((a) => a.title).join(", ")}. Deleting it will remove it from those assessments too.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteCandidate) deleteQuestion(deleteCandidate.id);
          setDeleteCandidate(null);
        }}
        onCancel={() => setDeleteCandidate(null)}
      />
    </div>
  );
}
