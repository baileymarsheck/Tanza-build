import { CalendarClock, Lock, Unlock } from "lucide-react";
import {
  formatReleaseDate,
  isReleased,
  isScheduledPending,
} from "@/lib/availability";
import type { AvailabilityStatus } from "@/lib/types";

// Shared between classes and assessments (admin manager + fellow browser) so
// availability always reads the same way: released, scheduled (with date),
// or locked.
export function StatusPill({
  item,
}: {
  item: { status: AvailabilityStatus; releaseAt?: string | null };
}) {
  if (isReleased(item)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <Unlock size={12} />
        Released
      </span>
    );
  }

  if (isScheduledPending(item) && item.releaseAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
        <CalendarClock size={12} />
        Unlocks {formatReleaseDate(item.releaseAt)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
      <Lock size={12} />
      Locked
    </span>
  );
}
