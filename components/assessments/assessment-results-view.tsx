import { Check, X } from "lucide-react";
import type { AssessmentAttempt, AssessmentRecord, Question } from "@/lib/types";

export function AssessmentResultsView({
  assessment,
  questions,
  attempt,
}: {
  assessment: AssessmentRecord;
  questions: Question[];
  attempt: AssessmentAttempt;
}) {
  const pendingCount = attempt.answers.filter((a) => a.pointsAwarded === null).length;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-brand-navy">{assessment.title}</h2>
        {assessment.description && (
          <p className="mt-1 text-sm text-slate-600">{assessment.description}</p>
        )}
      </div>

      <div
        className={`rounded-xl border p-5 ${
          attempt.status === "graded"
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        {attempt.status === "graded" ? (
          <p className="text-2xl font-semibold text-emerald-700">
            {attempt.scoreEarned} / {attempt.scorePossible}
          </p>
        ) : (
          <>
            <p className="text-lg font-semibold text-amber-800">
              Submitted — awaiting review
            </p>
            <p className="mt-1 text-sm text-amber-700">
              {pendingCount} short-answer response{pendingCount === 1 ? "" : "s"} pending
              review.
            </p>
          </>
        )}
      </div>

      <div className="space-y-5">
        {questions.map((q, i) => {
          const result = attempt.answers.find((a) => a.questionId === q.id);
          if (!result) return null;
          const correctOption = q.options.find((o) => o.correct);

          return (
            <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-3 text-sm font-medium text-slate-900">
                {i + 1}. {q.prompt}
              </p>

              {q.type === "multiple-choice" ? (
                <div className="space-y-2">
                  {q.options.map((o) => {
                    const wasSelected = result.answer.selectedOptionId === o.id;
                    const isTheCorrectOne = o.id === correctOption?.id;
                    const showAsCorrect = isTheCorrectOne && (!result.isCorrect || wasSelected);
                    return (
                      <div
                        key={o.id}
                        className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm ${
                          wasSelected && result.isCorrect
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : wasSelected && !result.isCorrect
                              ? "border-red-300 bg-red-50 text-red-800"
                              : showAsCorrect
                                ? "border-emerald-200 bg-emerald-50/50 text-emerald-700"
                                : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {wasSelected && result.isCorrect && <Check size={15} />}
                        {wasSelected && !result.isCorrect && <X size={15} />}
                        <span>{o.text}</span>
                        {!wasSelected && showAsCorrect && (
                          <span className="ml-auto text-xs font-medium">Correct answer</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
                    {result.answer.text}
                  </p>
                  {result.pointsAwarded === null ? (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Pending review
                    </span>
                  ) : (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
                      <p className="text-sm font-medium text-emerald-800">
                        {result.pointsAwarded} / {result.pointsPossible} points
                      </p>
                      {result.feedback && (
                        <p className="mt-1 text-sm text-emerald-700">{result.feedback}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
