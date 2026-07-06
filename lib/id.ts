// Short, readable, collision-safe-enough ids for client-generated records
// (e.g. "cls-a1b2c3d"). Not cryptographically unique — fine for this app's
// scale; a Supabase-backed version would just use the DB's own id generation.
export function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
