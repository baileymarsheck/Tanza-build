export type Role = "admin" | "fellow";

export interface Profile {
  id: string;
  name: string;
  role: Role;
}

// --- Curriculum ---------------------------------------------------------

// How a class becomes available to fellows:
//  - "released": manually visible now
//  - "locked": manually hidden
//  - "scheduled": hidden until `releaseAt`, then automatically visible
// A manual toggle sets "released"/"locked" and clears any schedule, so a
// manual choice always overrides a scheduled date.
export type ClassStatus = "locked" | "released" | "scheduled";

export type ResourceKind =
  | "template"
  | "toolkit"
  | "reading"
  | "slides"
  | "link";

export interface ClassResource {
  id: string;
  label: string;
  url: string;
  kind: ResourceKind;
}

export interface ClassVideo {
  id: string;
  title: string;
  // Public URL of a file in the Supabase Storage 'class-videos' bucket, or
  // any directly-playable video URL when added manually.
  url: string;
}

export interface ClassRecord {
  id: string;
  moduleId: string;
  title: string;
  summary: string;
  status: ClassStatus;
  // ISO timestamp; only meaningful when status === "scheduled".
  releaseAt?: string | null;
  notes: string;
  transcript: string;
  resources: ClassResource[];
  // Optional so curriculum saved before videos existed (older localStorage,
  // seed rows) stays valid; treated as [] wherever it's read.
  videos?: ClassVideo[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
}

export interface ModuleWithClasses extends Module {
  classes: ClassRecord[];
}
