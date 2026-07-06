"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCurriculum } from "@/lib/curriculum";
import { useAssessments } from "@/lib/assessments";
import { defaultScheduleIso } from "@/lib/availability";
import { StatusPill } from "@/components/curriculum/status-pill";
import { AvailabilityRow } from "@/components/availability-row";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { QuestionEditorModal } from "@/components/assessments/question-editor-modal";
import { AssessmentEditorModal } from "@/components/assessments/assessment-editor-modal";
import type { AssessmentRecord, Question } from "@/lib/types";

function makeOptionId() {
  return `opt-${Math.random().toString(36).slice(2, 9)}`;
}

export function AdminAssessmentsView() {
  const { modules } = useCurriculum();
  const {
    questions,
    attempts,
    addQuestion,
    deleteQuestion,
    isQuestionInUse,
    getAssessmentsForClass,
  } = useAssessments();

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingAssessment, setEditingAssessment] =
    useState<AssessmentRecord | null>(null);
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
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-brand-navy">Assessments</h2>
        <p className="mt-1 text-sm text-slate-600">
          Manage the shared question bank and the assessments attached to each
          class.
        </p>
      </div>

      {/* Question bank */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
          <div>
            <h3 className="font-semibold text-brand-navy">Question Bank</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              Reusable questions, taggable to aptitudes and competencies.
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
        </header>

        <ul className="divide-y divide-slate-100">
          {questions.length === 0 && (
            <li className="px-5 py-4 text-sm text-slate-400">
              No questions yet.
            </li>
          )}
          {questions.map((q) => {
            const weightSummary = (["technical", "strategic", "leadership"] as const)
              .map((a) => ({ a, w: q.aptitudeWeights[a] }))
              .filter((x) => x.w)
              .map(
                (x) =>
                  `${x.w}% ${x.a[0].toUpperCase()}${x.a.slice(1)}`
              )
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
      </section>

      {/* Assessments, grouped by module */}
      <div className="space-y-5">
        {modules.map((module) => {
          const rows = module.classes.flatMap((klass) =>
            getAssessmentsForClass(klass.id).map((a) => ({ klass, assessment: a }))
          );
          if (rows.length === 0) return null;

          return (
            <section
              key={module.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <header className="border-b border-slate-200 bg-slate-50 px-5 py-3.5">
                <h3 className="font-semibold text-brand-navy">{module.title}</h3>
              </header>
              <ul className="divide-y divide-slate-100">
                {rows.map(({ klass, assessment }) => {
                  const assessmentAttempts = attempts.filter(
                    (at) => at.assessmentId === assessment.id
                  );
                  const gradedCount = assessmentAttempts.filter(
                    (at) => at.status === "graded"
                  ).length;

                  return (
                    <li key={assessment.id} className="px-5 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium text-slate-900">
                              {assessment.title}
                            </span>
                            <StatusPill item={assessment} />
                          </div>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {klass.title} · {assessment.questionIds.length}{" "}
                            question{assessment.questionIds.length === 1 ? "" : "s"}
                            {assessmentAttempts.length > 0
                              ? ` · ${gradedCount}/${assessmentAttempts.length} graded`
                              : ""}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setEditingAssessment(assessment)}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>

                        <AvailabilityRowForAssessment assessment={assessment} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <QuestionEditorModal
        question={editingQuestion}
        onClose={() => setEditingQuestion(null)}
      />
      <AssessmentEditorModal
        assessment={editingAssessment}
        onClose={() => setEditingAssessment(null)}
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

// Thin wrapper wiring AvailabilityRow's callbacks to an assessment via the
// assessments store (kept local since it's only used in this one list).
function AvailabilityRowForAssessment({
  assessment,
}: {
  assessment: AssessmentRecord;
}) {
  const { updateAssessment, toggleAssessmentStatus } = useAssessments();

  return (
    <AvailabilityRow
      status={assessment.status}
      releaseAt={assessment.releaseAt}
      itemLabel={assessment.title}
      onSchedule={() =>
        updateAssessment(assessment.id, {
          status: "scheduled",
          releaseAt: assessment.releaseAt ?? defaultScheduleIso(),
        })
      }
      onUnschedule={() =>
        updateAssessment(assessment.id, { status: "locked", releaseAt: null })
      }
      onChangeReleaseAt={(iso) => updateAssessment(assessment.id, { releaseAt: iso })}
      onToggleRelease={() => toggleAssessmentStatus(assessment.id)}
    />
  );
}
