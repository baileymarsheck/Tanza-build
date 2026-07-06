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
import type {
  AssessmentAttempt,
  AssessmentRecord,
  AttemptAnswerResult,
  Question,
  QuestionAnswer,
} from "@/lib/types";

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

// A future Supabase-backed implementation would swap the localStorage read/
// write below for queries against the questions / assessments /
// assessment_questions / assessment_attempts / attempt_answers tables — the
// context surface (questions/assessments/attempts + these actions) stays the
// same, so nothing consuming useAssessments() would change.
export function AssessmentsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<AssessmentsState>(SEED_STATE);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ASSESSMENTS_STORAGE_KEY);
      if (stored) {
        setState(JSON.parse(stored) as AssessmentsState);
      }
    } catch {
      // Corrupt or unavailable storage — keep the seed.
    }
  }, []);

  const commit = useCallback((next: AssessmentsState) => {
    setState(next);
    try {
      window.localStorage.setItem(ASSESSMENTS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage write failures — in-memory state still updates.
    }
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
      commit({ ...state, assessments: [...state.assessments, assessment] });
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
    },
    [state, commit]
  );

  const toggleAssessmentStatus = useCallback(
    (assessmentId: string) => {
      commit({
        ...state,
        assessments: state.assessments.map((a) =>
          a.id === assessmentId
            ? {
                ...a,
                status: isReleased(a) ? "locked" : "released",
                releaseAt: null,
              }
            : a
        ),
      });
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
      commit({
        ...state,
        attempts: state.attempts.map((attempt) => {
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
            status: allGraded ? "graded" : "submitted",
            gradedAt: allGraded ? new Date().toISOString() : attempt.gradedAt,
          };
        }),
      });
    },
    [state, commit]
  );

  const resetToSample = useCallback(() => {
    commit(SEED_STATE);
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
