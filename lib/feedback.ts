import { makeId } from "@/lib/id";

export type FeedbackCategory = "bug" | "feature" | "general";

export interface FeedbackEntry {
  id: string;
  profileId: string;
  profileName: string;
  category: FeedbackCategory;
  message: string;
  createdAt: string;
}

const FEEDBACK_STORAGE_KEY = "tanza:feedback-entries";

// Simple localStorage-backed log of submitted feedback — no Supabase table
// yet, mirroring the fallback-first approach used elsewhere until this needs
// to be visible outside the browser that submitted it.
export function saveFeedback(entry: {
  profileId: string;
  profileName: string;
  category: FeedbackCategory;
  message: string;
}): void {
  const stored: FeedbackEntry[] = readFeedback();
  const next: FeedbackEntry = {
    id: makeId("fb"),
    createdAt: new Date().toISOString(),
    ...entry,
  };
  window.localStorage.setItem(
    FEEDBACK_STORAGE_KEY,
    JSON.stringify([...stored, next])
  );
}

export function readFeedback(): FeedbackEntry[] {
  try {
    const raw = window.localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FeedbackEntry[]) : [];
  } catch {
    return [];
  }
}
