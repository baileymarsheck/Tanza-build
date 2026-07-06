"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCurriculum } from "@/lib/curriculum";
import { useAssessments } from "@/lib/assessments";
import { useCurrentProfile } from "@/lib/current-profile";
import { isReleased, isScheduledPending } from "@/lib/availability";
import { LockedPanel } from "@/components/locked-panel";
import { AssessmentForm } from "@/components/assessments/assessment-form";
import { AssessmentResultsView } from "@/components/assessments/assessment-results-view";
import type { Question } from "@/lib/types";

export default function AssessmentTakePage() {
  const params = useParams<{ assessmentId: string }>();
  const { profile } = useCurrentProfile();
  const { getAssessment, getAttempt, submitAttempt, questions } = useAssessments();
  const { getClass } = useCurriculum();

  const backLink = (
    <Link
      href="/assessments"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-navy"
    >
      <ArrowLeft size={15} />
      Back to Assessments
    </Link>
  );

  const assessment = getAssessment(params.assessmentId);
  if (!assessment) {
    return (
      <div className="max-w-2xl space-y-4">
        {backLink}
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          This assessment doesn&apos;t exist or has been removed.
        </div>
      </div>
    );
  }

  const found = getClass(assessment.classId);
  if (!found) {
    return (
      <div className="max-w-2xl space-y-4">
        {backLink}
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          This assessment doesn&apos;t exist or has been removed.
        </div>
      </div>
    );
  }
  const { klass } = found;

  // Gate on the parent class first — no point unlocking an assessment behind
  // a class the fellow can't even open.
  if (!isReleased(klass)) {
    return (
      <div className="max-w-2xl space-y-4">
        {backLink}
        <LockedPanel
          noun="class"
          name={klass.title}
          scheduledPending={isScheduledPending(klass)}
          releaseAt={klass.releaseAt}
        />
      </div>
    );
  }

  if (!isReleased(assessment) && !isScheduledPending(assessment)) {
    return (
      <div className="max-w-2xl space-y-4">
        {backLink}
        <LockedPanel noun="assessment" name={assessment.title} scheduledPending={false} />
      </div>
    );
  }

  if (isScheduledPending(assessment)) {
    return (
      <div className="max-w-2xl space-y-4">
        {backLink}
        <LockedPanel
          noun="assessment"
          name={assessment.title}
          scheduledPending
          releaseAt={assessment.releaseAt}
        />
      </div>
    );
  }

  const assessmentQuestions = assessment.questionIds
    .map((id) => questions.find((q) => q.id === id))
    .filter((q): q is Question => !!q);
  const attempt = getAttempt(assessment.id, profile.id);

  return (
    <div className="space-y-4">
      {backLink}
      {attempt ? (
        <AssessmentResultsView
          assessment={assessment}
          questions={assessmentQuestions}
          attempt={attempt}
        />
      ) : (
        <AssessmentForm
          assessment={assessment}
          questions={assessmentQuestions}
          onSubmit={(answers) => submitAttempt(assessment.id, profile.id, answers)}
        />
      )}
    </div>
  );
}
