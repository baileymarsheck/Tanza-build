"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ASSESSMENTS_STORAGE_KEY,
  SEED_ASSESSMENTS,
  SEED_ATTEMPTS,
  SEED_QUESTIONS,
} from "@/lib/assessments-data";
import { isReleased } from "@/lib/availability";
import { makeId } from "@/lib/id";
import { getStoredItem, setStoredItem } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import type {
  AssessmentAttempt,
  AssessmentRecord,
  AttemptAnswerResult,
  AvailabilityStatus,
  Question,
  QuestionAnswer,
} from "@/lib/types";

type Supabase = NonNullable<ReturnType<typeof createClient>>;

interface AssessmentsState {
  questions: Question[];
  assessments: AssessmentRecord[];
  attempts: AssessmentAttempt[];
}

const SEED_STATE: AssessmentsState = {
  questions: SEED_QUESTIONS,
  assessments: SEED_ASSESSMENTS,
  attempts: SEED_ATTEMPTS,
};

interface AssessmentsContextValue {
  questions: Question[];
  assessments: AssessmentRecord[];
  attempts: AssessmentAttempt[];

  // Question bank
  addQuestion: (input: Omit<Question, "id" | "createdAt">) => Question;
  updateQuestion: (questionId: string, patch: Partial<Question>) => void;
  deleteQuestion: (questionId: string) => void;
  isQuestionInUse: (questionId: string) => AssessmentRecord[];

  // Assessments
  getAssessmentsForClass: (classId: string) => AssessmentRecord[];
  getAssessment: (assessmentId: string) => AssessmentRecord | null;
  addAssessment: (classId: string) => AssessmentRecord;
  updateAssessment: (
    assessmentId: string,
    patch: Partial<AssessmentRecord>
  ) => void;
  deleteAssessment: (assessmentId: string) => void;
  toggleAssessmentStatus: (assessmentId: string) => void;

  // Attempts
  getAttempt: (
    assessmentId: string,
    fellowId: string
  ) => AssessmentAttempt | null;
  getUngradedAttempts: () => AssessmentAttempt[];
  submitAttempt: (
    assessmentId: string,
    fellowId: string,
    answers: QuestionAnswer[]
  ) => AssessmentAttempt;
  gradeShortAnswer: (
    attemptId: string,
    questionId: string,
    pointsAwarded: number,
    feedback?: string
  ) => void;

  resetToSample: () => void;
}

const AssessmentsContext = createContext<AssessmentsContextValue | null>(null);

function gradeOneAnswer(
  question: Question,
  answer: QuestionAnswer
): AttemptAnswerResult {
  if (question.type === "multiple-choice") {
    const correctOption = question.options.find((o) => o.correct);
    const isCorrect = answer.selectedOptionId === correctOption?.id;
    return {
      questionId: question.id,
      answer,
      isCorrect,
      pointsAwarded: isCorrect ? question.points : 0,
      pointsPossible: question.points,
      gradedAt: new Date().toISOString(),
    };
  }
  // Short-answer: always pending until an admin grades it.
  return {
    questionId: question.id,
    answer,
    pointsAwarded: null,
    pointsPossible: question.points,
  };
}

function summarize(answers: AttemptAnswerResult[]) {
  const scoreEarned = answers.reduce((sum, a) => sum + (a.pointsAwarded ?? 0), 0);
  const scorePossible = answers.reduce((sum, a) => sum + a.pointsPossible, 0);
  const allGraded = answers.every((a) => a.pointsAwarded !== null);
  return { scoreEarned, scorePossible, allGraded };
}

// --- Supabase row shapes + reshaping -------------------------------------

interface QuestionRow {
  id: string;
  type: Question["type"];
  prompt: string;
  points: number;
  weight_technical: number;
  weight_strategic: number;
  weight_leadership: number;
  tags: string[];
  created_at: string;
  question_options: { id: string; text: string; is_correct: boolean }[];
}

function reshapeQuestions(rows: QuestionRow[]): Question[] {
  return rows.map((q) => ({
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    options: (q.question_options ?? []).map((o) => ({
      id: o.id,
      text: o.text,
      correct: o.is_correct,
    })),
    points: q.points,
    aptitudeWeights: {
      technical: q.weight_technical,
      strategic: q.weight_strategic,
      leadership: q.weight_leadership,
    },
    tags: q.tags ?? [],
    createdAt: q.created_at,
  }));
}

interface AssessmentRow {
  id: string;
  class_id: string;
  title: string;
  description: string;
  status: AvailabilityStatus;
  release_at: string | null;
  created_at: string;
  assessment_questions: { question_id: string }[];
}

function reshapeAssessments(rows: AssessmentRow[]): AssessmentRecord[] {
  return rows.map((a) => ({
    id: a.id,
    classId: a.class_id,
    title: a.title,
    description: a.description,
    status: a.status,
    releaseAt: a.release_at,
    questionIds: (a.assessment_questions ?? []).map((aq) => aq.question_id),
    createdAt: a.created_at,
  }));
}

interface AttemptRow {
  id: string;
  assessment_id: string;
  class_id: string;
  fellow_id: string;
  status: AssessmentAttempt["status"];
  score_earned: number;
  score_possible: number;
  submitted_at: string;
  graded_at: string | null;
  attempt_answers: {
    question_id: string;
    selected_option_id: string | null;
    answer_text: string | null;
    is_correct: boolean | null;
    points_awarded: number | null;
    points_possible: number;
    feedback: string | null;
    graded_at: string | null;
  }[];
}

function reshapeAttempts(rows: AttemptRow[]): AssessmentAttempt[] {
  return rows.map((att) => ({
    id: att.id,
    assessmentId: att.assessment_id,
    classId: att.class_id,
    fellowId: att.fellow_id,
    status: att.status,
    answers: (att.attempt_answers ?? []).map((ans) => ({
      questionId: ans.question_id,
      answer: {
        questionId: ans.question_id,
        selectedOptionId: ans.selected_option_id ?? undefined,
        text: ans.answer_text ?? undefined,
      },
      isCorrect: ans.is_correct ?? undefined,
      pointsAwarded: ans.points_awarded,
      pointsPossible: ans.points_possible,
      feedback: ans.feedback ?? undefined,
      gradedAt: ans.graded_at,
    })),
    scoreEarned: att.score_earned,
    scorePossible: att.score_possible,
    submittedAt: att.submitted_at,
    gradedAt: att.graded_at,
  }));
}

// --- Diff-sync helpers for the sub-array patches the editors send whole --

async function syncQuestionOptions(
  supabase: Supabase,
  questionId: string,
  options: Question["options"]
) {
  const { data: existing } = await supabase
    .from("question_options")
    .select("id")
    .eq("question_id", questionId);
  const nextIds = new Set(options.map((o) => o.id));
  const toDelete = (existing ?? [])
    .map((o) => o.id as string)
    .filter((id) => !nextIds.has(id));
  if (toDelete.length > 0) {
    await supabase.from("question_options").delete().in("id", toDelete);
  }
  if (options.length > 0) {
    await supabase.from("question_options").upsert(
      options.map((o, i) => ({
        id: o.id,
        question_id: questionId,
        text: o.text,
        is_correct: o.correct,
        position: i,
      }))
    );
  }
}

async function syncAssessmentQuestions(
  supabase: Supabase,
  assessmentId: string,
  questionIds: string[]
) {
  const { data: existing } = await supabase
    .from("assessment_questions")
    .select("question_id")
    .eq("assessment_id", assessmentId);
  const nextIds = new Set(questionIds);
  const toDelete = (existing ?? [])
    .map((r) => r.question_id as string)
    .filter((id) => !nextIds.has(id));
  if (toDelete.length > 0) {
    await supabase
      .from("assessment_questions")
      .delete()
      .eq("assessment_id", assessmentId)
      .in("question_id", toDelete);
  }
  if (questionIds.length > 0) {
    await supabase.from("assessment_questions").upsert(
      questionIds.map((questionId, i) => ({
        assessment_id: assessmentId,
        question_id: questionId,
        position: i,
      })),
      { onConflict: "assessment_id,question_id" }
    );
  }
}

// Same "optimistic local update first, background Supabase call second"
// pattern as lib/curriculum.tsx — see that file's top-level comment.
export function AssessmentsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<AssessmentsState>(SEED_STATE);

  useEffect(() => {
    const supabase = createClient();
    if (supabase) {
      (async () => {
        try {
          const [questionsRes, assessmentsRes, attemptsRes] = await Promise.all([
            supabase
              .from("questions")
              .select(
                `id, type, prompt, points, weight_technical, weight_strategic, weight_leadership, tags, created_at,
                 question_options ( id, text, is_correct, position )`
              )
              .order("created_at", { ascending: true })
              .order("position", {
                referencedTable: "question_options",
                ascending: true,
              }),
            supabase
              .from("assessments")
              .select(
                `id, class_id, title, description, status, release_at, created_at,
                 assessment_questions ( question_id, position )`
              )
              .order("position", { ascending: true })
              .order("position", {
                referencedTable: "assessment_questions",
                ascending: true,
              }),
            supabase
              .from("assessment_attempts")
              .select(
                `id, assessment_id, class_id, fellow_id, status, score_earned, score_possible, submitted_at, graded_at,
                 attempt_answers ( question_id, selected_option_id, answer_text, is_correct, points_awarded, points_possible, feedback, graded_at )`
              )
              .order("submitted_at", { ascending: true }),
          ]);

          if (!questionsRes.error && !assessmentsRes.error && !attemptsRes.error) {
            setState({
              questions: reshapeQuestions((questionsRes.data ?? []) as unknown as QuestionRow[]),
              assessments: reshapeAssessments((assessmentsRes.data ?? []) as unknown as AssessmentRow[]),
              attempts: reshapeAttempts((attemptsRes.data ?? []) as unknown as AttemptRow[]),
            });
            return;
          }
        } catch {
          // Network failure — fall through to the localStorage fallback.
        }
        loadFromLocalStorage();
      })();
      return;
    }

    loadFromLocalStorage();

    function loadFromLocalStorage() {
      const stored = getStoredItem(ASSESSMENTS_STORAGE_KEY);
      if (stored) {
        try {
          setState(JSON.parse(stored) as AssessmentsState);
        } catch {
          // Corrupt storage — keep the seed.
        }
      }
    }
  }, []);

  const commit = useCallback((next: AssessmentsState) => {
    setState(next);
    setStoredItem(ASSESSMENTS_STORAGE_KEY, JSON.stringify(next));
  }, []);

  // --- Question bank -------------------------------------------------

  const addQuestion = useCallback(
    (input: Omit<Question, "id" | "createdAt">) => {
      const question: Question = {
        ...input,
        id: makeId("q"),
        createdAt: new Date().toISOString(),
      };
      commit({ ...state, questions: [...state.questions, question] });

      const supabase = createClient();
      if (supabase) {
        (async () => {
          await supabase.from("questions").insert({
            id: question.id,
            type: question.type,
            prompt: question.prompt,
            points: question.points,
            weight_technical: question.aptitudeWeights.technical ?? 0,
            weight_strategic: question.aptitudeWeights.strategic ?? 0,
            weight_leadership: question.aptitudeWeights.leadership ?? 0,
            tags: question.tags,
            created_at: question.createdAt,
          });
          if (question.options.length > 0) {
            await supabase.from("question_options").insert(
              question.options.map((o, i) => ({
                id: o.id,
                question_id: question.id,
                text: o.text,
                is_correct: o.correct,
                position: i,
              }))
            );
          }
        })();
      }
      return question;
    },
    [state, commit]
  );

  const updateQuestion = useCallback(
    (questionId: string, patch: Partial<Question>) => {
      commit({
        ...state,
        questions: state.questions.map((q) =>
          q.id === questionId ? { ...q, ...patch } : q
        ),
      });

      const supabase = createClient();
      if (!supabase) return;

      const { options, aptitudeWeights, ...rest } = patch;
      const columnPatch: Record<string, unknown> = { ...rest };
      if (aptitudeWeights) {
        columnPatch.weight_technical = aptitudeWeights.technical ?? 0;
        columnPatch.weight_strategic = aptitudeWeights.strategic ?? 0;
        columnPatch.weight_leadership = aptitudeWeights.leadership ?? 0;
      }

      (async () => {
        if (Object.keys(columnPatch).length > 0) {
          await supabase.from("questions").update(columnPatch).eq("id", questionId);
        }
        if (options) await syncQuestionOptions(supabase, questionId, options);
      })();
    },
    [state, commit]
  );

  const isQuestionInUse = useCallback(
    (questionId: string) =>
      state.assessments.filter((a) => a.questionIds.includes(questionId)),
    [state.assessments]
  );

  const deleteQuestion = useCallback(
    (questionId: string) => {
      commit({
        ...state,
        questions: state.questions.filter((q) => q.id !== questionId),
        // Cascade: strip the deleted question out of every assessment that
        // referenced it, mirroring the DB's ON DELETE CASCADE.
        assessments: state.assessments.map((a) => ({
          ...a,
          questionIds: a.questionIds.filter((id) => id !== questionId),
        })),
      });

      const supabase = createClient();
      if (supabase) {
        supabase.from("questions").delete().eq("id", questionId).then();
      }
    },
    [state, commit]
  );

  // --- Assessments -----------------------------------------------------

  const getAssessmentsForClass = useCallback(
    (classId: string) => state.assessments.filter((a) => a.classId === classId),
    [state.assessments]
  );

  const getAssessment = useCallback(
    (assessmentId: string) =>
      state.assessments.find((a) => a.id === assessmentId) ?? null,
    [state.assessments]
  );

  const addAssessment = useCallback(
    (classId: string) => {
      const assessment: AssessmentRecord = {
        id: makeId("as"),
        classId,
        title: "Untitled assessment",
        description: "",
        status: "locked",
        questionIds: [],
        createdAt: new Date().toISOString(),
      };
      const siblingCount = state.assessments.filter(
        (a) => a.classId === classId
      ).length;
      commit({ ...state, assessments: [...state.assessments, assessment] });

      const supabase = createClient();
      if (supabase) {
        supabase
          .from("assessments")
          .insert({
            id: assessment.id,
            class_id: classId,
            title: assessment.title,
            description: assessment.description,
            status: assessment.status,
            position: siblingCount,
            created_at: assessment.createdAt,
          })
          .then();
      }
      return assessment;
    },
    [state, commit]
  );

  const updateAssessment = useCallback(
    (assessmentId: string, patch: Partial<AssessmentRecord>) => {
      commit({
        ...state,
        assessments: state.assessments.map((a) =>
          a.id === assessmentId ? { ...a, ...patch } : a
        ),
      });

      const supabase = createClient();
      if (!supabase) return;

      const { questionIds, releaseAt, ...rest } = patch;
      const columnPatch: Record<string, unknown> = { ...rest };
      if ("releaseAt" in patch) columnPatch.release_at = releaseAt ?? null;

      (async () => {
        if (Object.keys(columnPatch).length > 0) {
          await supabase.from("assessments").update(columnPatch).eq("id", assessmentId);
        }
        if (questionIds) {
          await syncAssessmentQuestions(supabase, assessmentId, questionIds);
        }
      })();
    },
    [state, commit]
  );

  const deleteAssessment = useCallback(
    (assessmentId: string) => {
      commit({
        ...state,
        assessments: state.assessments.filter((a) => a.id !== assessmentId),
        attempts: state.attempts.filter((a) => a.assessmentId !== assessmentId),
      });

      const supabase = createClient();
      if (supabase) {
        supabase.from("assessments").delete().eq("id", assessmentId).then();
      }
    },
    [state, commit]
  );

  const toggleAssessmentStatus = useCallback(
    (assessmentId: string) => {
      let nextStatus: AvailabilityStatus = "locked";
      commit({
        ...state,
        assessments: state.assessments.map((a) => {
          if (a.id !== assessmentId) return a;
          nextStatus = isReleased(a) ? "locked" : "released";
          return { ...a, status: nextStatus, releaseAt: null };
        }),
      });

      const supabase = createClient();
      if (supabase) {
        supabase
          .from("assessments")
          .update({ status: nextStatus, release_at: null })
          .eq("id", assessmentId)
          .then();
      }
    },
    [state, commit]
  );

  // --- Attempts ----------------------------------------------------------

  const getAttempt = useCallback(
    (assessmentId: string, fellowId: string) =>
      state.attempts.find(
        (a) => a.assessmentId === assessmentId && a.fellowId === fellowId
      ) ?? null,
    [state.attempts]
  );

  const getUngradedAttempts = useCallback(
    () => state.attempts.filter((a) => a.status === "submitted"),
    [state.attempts]
  );

  const submitAttempt = useCallback(
    (assessmentId: string, fellowId: string, answers: QuestionAnswer[]) => {
      const assessment = state.assessments.find((a) => a.id === assessmentId);
      const results = assessment
        ? assessment.questionIds
            .map((qid) => {
              const question = state.questions.find((q) => q.id === qid);
              const answer = answers.find((a) => a.questionId === qid);
              if (!question || !answer) return null;
              return gradeOneAnswer(question, answer);
            })
            .filter((r): r is AttemptAnswerResult => !!r)
        : [];

      const { scoreEarned, scorePossible, allGraded } = summarize(results);
      const attempt: AssessmentAttempt = {
        id: makeId("att"),
        assessmentId,
        classId: assessment?.classId ?? "",
        fellowId,
        status: allGraded ? "graded" : "submitted",
        answers: results,
        scoreEarned,
        scorePossible,
        submittedAt: new Date().toISOString(),
        gradedAt: allGraded ? new Date().toISOString() : null,
      };
      commit({ ...state, attempts: [...state.attempts, attempt] });

      const supabase = createClient();
      if (supabase) {
        (async () => {
          await supabase.from("assessment_attempts").insert({
            id: attempt.id,
            assessment_id: assessmentId,
            class_id: attempt.classId,
            fellow_id: fellowId,
            status: attempt.status,
            score_earned: attempt.scoreEarned,
            score_possible: attempt.scorePossible,
            submitted_at: attempt.submittedAt,
            graded_at: attempt.gradedAt,
          });
          if (results.length > 0) {
            await supabase.from("attempt_answers").insert(
              results.map((r) => ({
                id: makeId("ans"),
                attempt_id: attempt.id,
                question_id: r.questionId,
                selected_option_id: r.answer.selectedOptionId ?? null,
                answer_text: r.answer.text ?? null,
                is_correct: r.isCorrect ?? null,
                points_awarded: r.pointsAwarded,
                points_possible: r.pointsPossible,
                feedback: r.feedback ?? null,
                graded_at: r.gradedAt ?? null,
              }))
            );
          }
        })();
      }
      return attempt;
    },
    [state, commit]
  );

  const gradeShortAnswer = useCallback(
    (
      attemptId: string,
      questionId: string,
      pointsAwarded: number,
      feedback?: string
    ) => {
      const nextAttempts = state.attempts.map((attempt) => {
        if (attempt.id !== attemptId) return attempt;
        const answers = attempt.answers.map((a) =>
          a.questionId === questionId
            ? {
                ...a,
                pointsAwarded,
                feedback,
                gradedAt: new Date().toISOString(),
              }
            : a
        );
        const { scoreEarned, scorePossible, allGraded } = summarize(answers);
        return {
          ...attempt,
          answers,
          scoreEarned,
          scorePossible,
          status: allGraded ? ("graded" as const) : ("submitted" as const),
          gradedAt: allGraded ? new Date().toISOString() : attempt.gradedAt,
        };
      });
      commit({ ...state, attempts: nextAttempts });

      const supabase = createClient();
      const graded = nextAttempts.find((a) => a.id === attemptId);
      if (supabase && graded) {
        const gradedAnswer = graded.answers.find((a) => a.questionId === questionId);
        (async () => {
          await supabase
            .from("attempt_answers")
            .update({
              points_awarded: pointsAwarded,
              feedback: feedback ?? null,
              graded_at: gradedAnswer?.gradedAt ?? null,
            })
            .eq("attempt_id", attemptId)
            .eq("question_id", questionId);

          await supabase
            .from("assessment_attempts")
            .update({
              score_earned: graded.scoreEarned,
              score_possible: graded.scorePossible,
              status: graded.status,
              graded_at: graded.gradedAt,
            })
            .eq("id", attemptId);
        })();
      }
    },
    [state, commit]
  );

  const resetToSample = useCallback(() => {
    commit(SEED_STATE);

    const supabase = createClient();
    if (!supabase) return;

    // Destructive: wipes every question/assessment/attempt (and, via
    // cascade, every option/junction row/answer) and reinserts the seed.
    // Acceptable for this single-tenant demo scaffold.
    (async () => {
      await supabase.from("questions").delete().neq("id", "");
      await supabase.from("assessments").delete().neq("id", "");

      for (const question of SEED_QUESTIONS) {
        await supabase.from("questions").insert({
          id: question.id,
          type: question.type,
          prompt: question.prompt,
          points: question.points,
          weight_technical: question.aptitudeWeights.technical ?? 0,
          weight_strategic: question.aptitudeWeights.strategic ?? 0,
          weight_leadership: question.aptitudeWeights.leadership ?? 0,
          tags: question.tags,
          created_at: question.createdAt,
        });
        if (question.options.length > 0) {
          await supabase.from("question_options").insert(
            question.options.map((o, i) => ({
              id: o.id,
              question_id: question.id,
              text: o.text,
              is_correct: o.correct,
              position: i,
            }))
          );
        }
      }

      for (const [i, assessment] of SEED_ASSESSMENTS.entries()) {
        await supabase.from("assessments").insert({
          id: assessment.id,
          class_id: assessment.classId,
          title: assessment.title,
          description: assessment.description,
          status: assessment.status,
          release_at: assessment.releaseAt ?? null,
          position: i,
          created_at: assessment.createdAt,
        });
        if (assessment.questionIds.length > 0) {
          await supabase.from("assessment_questions").insert(
            assessment.questionIds.map((questionId, qi) => ({
              assessment_id: assessment.id,
              question_id: questionId,
              position: qi,
            }))
          );
        }
      }

      for (const attempt of SEED_ATTEMPTS) {
        await supabase.from("assessment_attempts").insert({
          id: attempt.id,
          assessment_id: attempt.assessmentId,
          class_id: attempt.classId,
          fellow_id: attempt.fellowId,
          status: attempt.status,
          score_earned: attempt.scoreEarned,
          score_possible: attempt.scorePossible,
          submitted_at: attempt.submittedAt,
          graded_at: attempt.gradedAt ?? null,
        });
        if (attempt.answers.length > 0) {
          await supabase.from("attempt_answers").insert(
            attempt.answers.map((r) => ({
              id: makeId("ans"),
              attempt_id: attempt.id,
              question_id: r.questionId,
              selected_option_id: r.answer.selectedOptionId ?? null,
              answer_text: r.answer.text ?? null,
              is_correct: r.isCorrect ?? null,
              points_awarded: r.pointsAwarded,
              points_possible: r.pointsPossible,
              feedback: r.feedback ?? null,
              graded_at: r.gradedAt ?? null,
            }))
          );
        }
      }
    })();
  }, [commit]);

  const value = useMemo(
    () => ({
      questions: state.questions,
      assessments: state.assessments,
      attempts: state.attempts,
      addQuestion,
      updateQuestion,
      deleteQuestion,
      isQuestionInUse,
      getAssessmentsForClass,
      getAssessment,
      addAssessment,
      updateAssessment,
      deleteAssessment,
      toggleAssessmentStatus,
      getAttempt,
      getUngradedAttempts,
      submitAttempt,
      gradeShortAnswer,
      resetToSample,
    }),
    [
      state,
      addQuestion,
      updateQuestion,
      deleteQuestion,
      isQuestionInUse,
      getAssessmentsForClass,
      getAssessment,
      addAssessment,
      updateAssessment,
      deleteAssessment,
      toggleAssessmentStatus,
      getAttempt,
      getUngradedAttempts,
      submitAttempt,
      gradeShortAnswer,
      resetToSample,
    ]
  );

  return (
    <AssessmentsContext.Provider value={value}>
      {children}
    </AssessmentsContext.Provider>
  );
}

export function useAssessments() {
  const context = useContext(AssessmentsContext);
  if (!context) {
    throw new Error("useAssessments must be used within an AssessmentsProvider");
  }
  return context;
}
