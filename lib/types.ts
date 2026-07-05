export type Role = "admin" | "fellow";

export interface Profile {
  id: string;
  name: string;
  role: Role;
}

// --- Curriculum ---------------------------------------------------------

// A class is either still locked (not yet available to fellows) or released.
// Kept as a string status rather than a boolean so more states (e.g.
// "scheduled") can be added later without a data migration.
export type ClassStatus = "locked" | "released";

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

export interface ClassRecord {
  id: string;
  moduleId: string;
  title: string;
  summary: string;
  status: ClassStatus;
  notes: string;
  transcript: string;
  resources: ClassResource[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
}

export interface ModuleWithClasses extends Module {
  classes: ClassRecord[];
}
