import { createClient } from "@/lib/supabase/client";
import type { ResourceKind } from "@/lib/types";

// Storage buckets for class media. Create both as public buckets in Supabase
// (Storage > New bucket > name, public). See supabase/schema.sql for the read
// policy notes.
export const CLASS_VIDEOS_BUCKET = "class-videos";
export const CLASS_RESOURCES_BUCKET = "class-resources";

async function uploadToBucket(
  bucket: string,
  file: File,
  classId: string,
  fallbackExt: string
): Promise<string> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error(
      "Supabase isn't connected, so files can't be uploaded here. Add a URL instead, or configure Supabase to enable uploads."
    );
  }

  const ext = file.name.includes(".")
    ? file.name.split(".").pop()
    : fallbackExt;
  const path = `${classId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Uploads a video file to Supabase Storage and returns its public URL.
 * Throws a clear error when Supabase isn't configured so the caller can fall
 * back to adding a video by URL instead.
 */
export function uploadClassVideo(file: File, classId: string): Promise<string> {
  return uploadToBucket(CLASS_VIDEOS_BUCKET, file, classId, "mp4");
}

/**
 * Uploads a resource file (PDF, slides, template, etc.) to Supabase Storage
 * and returns its public URL. Throws a clear error when Supabase isn't
 * configured so the caller can fall back to adding a URL instead.
 */
export function uploadClassResource(
  file: File,
  classId: string
): Promise<string> {
  return uploadToBucket(CLASS_RESOURCES_BUCKET, file, classId, "pdf");
}

const EXTENSION_KIND_MAP: Record<string, ResourceKind> = {
  ppt: "slides",
  pptx: "slides",
  key: "slides",
  doc: "template",
  docx: "template",
  xls: "template",
  xlsx: "template",
  csv: "template",
  zip: "toolkit",
};

/** Best-guess resource kind from a filename's extension; defaults to "reading". */
export function guessResourceKind(filename: string): ResourceKind {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_KIND_MAP[ext] ?? "reading";
}
