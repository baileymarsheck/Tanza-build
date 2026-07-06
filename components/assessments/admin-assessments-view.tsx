"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Pencil, RotateCcw } from "lucide-react";
import { useCurriculum } from "@/lib/curriculum";
import { useAssessments } from "@/lib/assessments";
import { defaultScheduleIso } from "@/lib/availability";
import { StatusPill } from "@/components/curriculum/status-pill";
import { AvailabilityRow } from "@/components/availability-row";
import { AssessmentEditorModal } from "@/components/assessments/assessment-editor-modal";
import type { AssessmentRecord } from "@/lib/types";

// Supports the "Create Assessment" nav flyout: it creates the assessment,
// then sends the admin here with ?edit={id} so the editor opens immediately.
// Clear the param right after so a refresh doesn't reopen it. Split out
// because useSearchParams() requires a Suspense boundary.
function EditParamHandler({
  onFound,
}: {
  onFound: (assessment: AssessmentRecord) => void;
}) {
  const { getAssessment } = useAssessments();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId) return;
    const found = getAssessment(editId);
    if (found) onFound(found);
    router.replace("/assessments");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}

export function AdminAssessmentsView() {
  const { modules } = useCurriculum();
  const { attempts, getAssessmentsForClass, resetToSample } = useAssessments();

  const [editingAssessment, setEditingAssessment] =
    useState<AssessmentRecord | null>(null);

  return (
    <div className="max-w-4xl space-y-8">
      <Suspense fallback={null}>
        <EditParamHandler onFound={setEditingAssessment} />
      </Suspense>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-brand-navy">Assessments</h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage the assessments attached to each class.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={resetToSample}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            title="Restore the sample questions/assessments"
          >
            <RotateCcw size={15} />
            Reset sample
          </button>
          <a
            href="/assessments/questions"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Question Bank
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

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

      <AssessmentEditorModal
        assessment={editingAssessment}
        onClose={() => setEditingAssessment(null)}
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
