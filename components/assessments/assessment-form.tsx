"use client";

import { useState } from "react";
import type { AssessmentRecord, Question, QuestionAnswer } from "@/lib/types";

export function AssessmentForm({
  assessment,
  questions,
  onSubmit,
}: {
  assessment: AssessmentRecord;
  questions: Question[];
  onSubmit: (answers: QuestionAnswer[]) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [error, setError] = useState<string | null>(null);

  function setAnswer(questionId: string, answer: QuestionAnswer) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  function handleSubmit() {
    const missing = questions.some((q) => {
      const a = answers[q.id];
      if (!a) return true;
      return q.type === "multiple-choice" ? !a.selectedOptionId : !a.text?.trim();
    });
    if (missing) {
      setError("Please answer every question before submitting.");
      return;
    }
    setError(null);
    onSubmit(Object.values(answers));
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-brand-navy">{assessment.title}</h2>
        {assessment.description && (
          <p className="mt-1 text-sm text-slate-600">{assessment.description}</p>
        )}
      </div>

      <div className="space-y-5">
        {questions.map((q, i) => (
          <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-sm font-medium text-slate-900">
              {i + 1}. {q.prompt}
            </p>

            {q.type === "multiple-choice" ? (
              <fieldset className="space-y-2">
                {q.options.map((o) => {
                  const selected = answers[q.id]?.selectedOptionId === o.id;
                  return (
                    <label
                      key={o.id}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5 transition-colors ${
                        selected
                          ? "border-brand-orange bg-orange-50/40"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={selected}
                        onChange={() => setAnswer(q.id, { questionId: q.id, selectedOptionId: o.id })}
                        className="size-4 shrink-0 accent-brand-orange"
                      />
                      <span className="text-sm text-slate-800">{o.text}</span>
                    </label>
                  );
                })}
              </fieldset>
            ) : (
              <textarea
                value={answers[q.id]?.text ?? ""}
                onChange={(e) => setAnswer(q.id, { questionId: q.id, text: e.target.value })}
                rows={5}
                className="input resize-y"
                placeholder="Type your answer…"
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        className="rounded-lg bg-brand-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-navy-light"
      >
        Submit
      </button>
    </div>
  );
}
