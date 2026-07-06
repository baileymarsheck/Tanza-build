import { createClient } from "@/lib/supabase/client";
import { makeId } from "@/lib/id";
import { getStoredItem, setStoredItem } from "@/lib/storage";

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

// Tries the Supabase `feedback` table first so submissions are durable and
// shared across devices; falls back to this browser's local storage when no
// Supabase project is connected yet (or the request fails), matching the
// zero-setup fallback pattern used elsewhere in the app.
export async function saveFeedback(entry: {
  profileId: string;
  profileName: string;
  category: FeedbackCategory;
  message: string;
}): Promise<void> {
  const next: FeedbackEntry = {
    id: makeId("fb"),
    createdAt: new Date().toISOString(),
    ...entry,
  };

  const supabase = createClient();
  if (supabase) {
    const { error } = await supabase.from("feedback").insert({
      id: next.id,
      profile_id: next.profileId,
      profile_name: next.profileName,
      category: next.category,
      message: next.message,
      created_at: next.createdAt,
    });
    if (!error) return;
  }

  const stored = readLocalFeedback();
  setStoredItem(FEEDBACK_STORAGE_KEY, JSON.stringify([...stored, next]));
}

export async function readFeedback(): Promise<FeedbackEntry[]> {
  const supabase = createClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("feedback")
      .select("id, profile_id, profile_name, category, message, created_at")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data.map((row) => ({
        id: row.id,
        profileId: row.profile_id,
        profileName: row.profile_name,
        category: row.category,
        message: row.message,
        createdAt: row.created_at,
      }));
    }
  }

  return readLocalFeedback();
}

function readLocalFeedback(): FeedbackEntry[] {
  const raw = getStoredItem(FEEDBACK_STORAGE_KEY);
  try {
    return raw ? (JSON.parse(raw) as FeedbackEntry[]) : [];
  } catch {
    return [];
  }
}
