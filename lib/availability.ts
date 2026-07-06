import type { AvailabilityStatus } from "@/lib/types";

// Shared shape for anything with the locked/released/scheduled lifecycle —
// classes and assessments both satisfy this structurally, no inheritance
// needed.
interface Availability {
  status: AvailabilityStatus;
  releaseAt?: string | null;
}

// Whether an item is effectively visible to fellows right now: manually
// released, or scheduled with the release time already passed.
//
// Note: this is evaluated at render time, so a scheduled item flips to
// released on the next load/interaction after its time — not live on an open
// page. Day-granularity release dates make that gap immaterial in practice.
export function isReleased(item: Availability, now: Date = new Date()): boolean {
  if (item.status === "released") return true;
  if (item.status === "scheduled" && item.releaseAt) {
    return new Date(item.releaseAt).getTime() <= now.getTime();
  }
  return false;
}

// Scheduled but the release time is still in the future (i.e. currently locked
// but with a known unlock date to surface in the UI).
export function isScheduledPending(
  item: Availability,
  now: Date = new Date()
): boolean {
  return (
    item.status === "scheduled" &&
    !!item.releaseAt &&
    new Date(item.releaseAt).getTime() > now.getTime()
  );
}

// Short "Jul 8" style label for pills and list hints.
export function formatReleaseDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// Fuller "May 20, 2030, 9:00 AM" label for read-only date displays.
export function formatReleaseDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Convert between an ISO timestamp and the value a
// <input type="datetime-local"> expects (local "YYYY-MM-DDTHH:mm").
export function isoToDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function datetimeLocalToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// Sensible default when an admin first schedules something: a week out at 09:00.
export function defaultScheduleIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}
