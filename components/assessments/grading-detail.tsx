"use client";

import { useState } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import { useAssessments } from "@/lib/assessments";
import { useCurriculum } from "@/lib/curriculum";
import { useCurrentProfile } from "@/lib/current-profile";
import { formatReleaseDateTime } from "@/lib/availability";

export function GradingDetail({
  attemptId,
  onBack,
}: {
  attemptId: string;
  onBack: () => void;
}) {
  const { attempts, questions, getAssessment, gradeShortAnswer } = useAssessments();
  const { getClass } = useCurriculum();
  const { allProfiles } = useCurrentProfile();

  const attempt = attempts.find((a) => a.id === attemptId);
  if (!attempt) return null;

  const assessment = getAssessment(attempt.assessmentId);
  const found = getClass(attempt.classId);
  const fellow = allProfiles.find((p) => p.id === attempt.fellowId);

  return (
    <div className="max-w-2xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-navy"
      >
        <ArrowLeft size={15} />
        Back to submissions
      </button>

      <div className="mb-5">
        <h2 className="text-xl font-semibold text-brand-navy">
          {assessment?.title ?? "Assessment"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {fellow?.name ?? "Fellow"} · {found?.klass.title ?? ""} · submitted{" "}
          {formatReleaseDateTime(attempt.submittedAt)}
        </p>
      </div>

      {attempt.status === "graded" && (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          All responses graded — {attempt.scoreEarned} / {attempt.scorePossible} points.
        </div>
      )}

      <div className="space-y-5">
        {attempt.answers.map((result, i) => {
          const question = questions.find((q) => q.id === result.questionId);
          if (!question) return null;

          return (
            <div key={result.questionId} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-3 text-sm font-medium text-slate-900">
                {i + 1}. {question.prompt}
              </p>

              {question.type === "multiple-choice" ? (
                <div className="space-y-2">
                  {question.options.map((o) => {
                    const wasSelected = result.answer.selectedOptionId === o.id;
                    if (!wasSelected && !o.correct) return null;
                    return (
                      <div
                        key={o.id}
                        className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm ${
                          wasSelected && result.isCorrect
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : wasSelected
                              ? "border-red-300 bg-red-50 text-red-800"
                              : "border-slate-200 text-slate-500"
                        }`}
                      >
                        {wasSelected && result.isCorrect && <Check size={15} />}
                        {wasSelected && !result.isCorrect && <X size={15} />}
                        <span>{o.text}</span>
                        {!wasSelected && o.correct && (
                          <span className="ml-auto text-xs font-medium">Correct answer</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <ShortAnswerGrader
                  attemptId={attempt.id}
                  questionId={question.id}
                  text={result.answer.text ?? ""}
                  pointsPossible={result.pointsPossible}
                  pointsAwarded={result.pointsAwarded}
                  feedback={result.feedback}
                  onGrade={gradeShortAnswer}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShortAnswerGrader({
  attemptId,
  questionId,
  text,
  pointsPossible,
  pointsAwarded,
  feedback,
  onGrade,
}: {
  attemptId: string;
  questionId: string;
  text: string;
  pointsPossible: number;
  pointsAwarded: number | null;
  feedback?: string;
  onGrade: (
    attemptId: string,
    questionId: string,
    pointsAwarded: number,
    feedback?: string
  ) => void;
}) {
  const [points, setPoints] = useState(pointsAwarded ?? pointsPossible);
  const [feedbackText, setFeedbackText] = useState(feedback ?? "");

  return (
    <div className="space-y-3">
      <p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
        {text}
      </p>

      <div className="flex items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Points (of {pointsPossible})
          </span>
          <input
            type="number"
            min={0}
            max={pointsPossible}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value) || 0)}
            className="input w-24"
          />
        </label>
        <button
          type="button"
          onClick={() => onGrade(attemptId, questionId, points, feedbackText.trim() || undefined)}
          className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
        >
          Save grade
        </button>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">
          Feedback (optional)
        </span>
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          rows={2}
          className="input resize-y"
        />
      </label>

      {pointsAwarded !== null && (
        <p className="text-xs font-medium text-emerald-700">
          Graded: {pointsAwarded} / {pointsPossible}
        </p>
      )}
    </div>
  );
}
