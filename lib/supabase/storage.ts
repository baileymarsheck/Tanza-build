import { createClient } from "@/lib/supabase/client";

// Storage bucket that holds class recordings. Create it as a public bucket in
// Supabase (Storage > New bucket > name "class-videos", public). See
// supabase/schema.sql for the read policy note.
export const CLASS_VIDEOS_BUCKET = "class-videos";

/**
 * Uploads a video file to Supabase Storage and returns its public URL.
 * Throws a clear error when Supabase isn't configured so the caller can fall
 * back to adding a video by URL instead.
 */
export async function uploadClassVideo(
  file: File,
  classId: string
): Promise<string> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error(
      "Supabase isn't connected, so files can't be uploaded here. Add a video URL instead, or configure Supabase to enable uploads."
    );
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "mp4";
  const path = `${classId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(CLASS_VIDEOS_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(CLASS_VIDEOS_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}
