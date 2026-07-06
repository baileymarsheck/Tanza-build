"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useCurrentProfile } from "@/lib/current-profile";
import { useCurriculum } from "@/lib/curriculum";
import { useAssessments } from "@/lib/assessments";
import { getAvailableAssessments, summarizeFellowProgress } from "@/lib/fellow-progress";
import { AttemptStatusBadge } from "@/components/assessments/attempt-status-badge";
import { AssessmentResultsView } from "@/components/assessments/assessment-results-view";
import type { Question } from "@/lib/types";

function BackLink() {
  return (
    <Link
      href="/performance/cohort"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-navy"
    >
      <ArrowLeft size={15} />
      Back to Fellow Cohort
    </Link>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xl font-semibold text-brand-navy">{value}</p>
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function FellowDetailView({ fellowId }: { fellowId: string }) {
  const { allProfiles } = useCurrentProfile();
  const { modules } = useCurriculum();
  const { getAssessmentsForClass, getAttempt, questions } = useAssessments();
  const [viewingAssessmentId, setViewingAssessmentId] = useState<string | null>(null);

  const fellow = allProfiles.find((p) => p.id === fellowId);
  const available = getAvailableAssessments(modules, getAssessmentsForClass);
  const progress = summarizeFellowProgress(fellowId, available, getAttempt);

  if (!fellow) {
    return (
      <div className="max-w-2xl space-y-4">
        <BackLink />
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          This fellow doesn&apos;t exist or has been removed.
        </div>
      </div>
    );
  }

  const viewingItem = viewingAssessmentId
    ? progress.items.find(
        (item) => item.assessment.id === viewingAssessmentId && item.attempt
      )
    : null;

  if (viewingItem && viewingItem.attempt) {
    const assessmentQuestions = viewingItem.assessment.questionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter((q): q is Question => !!q);

    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setViewingAssessmentId(null)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          Back to {fellow.name}
        </button>
        <AssessmentResultsView
          assessment={viewingItem.assessment}
          questions={assessmentQuestions}
          attempt={viewingItem.attempt}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <BackLink />
      <h2 className="mt-3 text-xl font-semibold text-brand-navy">{fellow.name}</h2>

      <div className="mt-4 grid grid-cols-4 gap-4">
        <StatTile
          label="Score so far"
          value={
            progress.gradedCount === 0
              ? "—"
              : `${progress.scoreEarned} / ${progress.scorePossible}`
          }
        />
        <StatTile label="Technical" value="N/A" />
        <StatTile label="Strategic" value="N/A" />
        <StatTile label="Leadership" value="N/A" />
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 bg-slate-50 px-5 py-3.5">
          <h3 className="font-semibold text-brand-navy">Quizzes</h3>
        </header>

        {progress.items.length === 0 ? (
          <p className="px-5 py-4 text-sm text-slate-400">
            No assessments have been released yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {progress.items.map(({ klass, assessment, attempt }) => (
              <li key={assessment.id}>
                <button
                  type="button"
                  onClick={() => attempt && setViewingAssessmentId(assessment.id)}
                  disabled={!attempt}
                  className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors ${
                    attempt ? "hover:bg-slate-50" : "cursor-default"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{assessment.title}</p>
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {klass.title}
                    </p>
                  </div>
                  <AttemptStatusBadge attempt={attempt} />
                  {attempt && (
                    <ChevronRight size={16} className="shrink-0 text-slate-300" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 bg-slate-50 px-5 py-3.5">
          <h3 className="font-semibold text-brand-navy">Feedback</h3>
        </header>
        <p className="px-5 py-4 text-sm text-slate-400">
          Coming soon — written feedback from admins will appear here.
        </p>
      </section>
    </div>
  );
}
