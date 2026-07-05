export type Role = "admin" | "fellow";

export interface Profile {
  id: string;
  name: string;
  role: Role;
}
