import { Lock } from "lucide-react";
import { formatReleaseDate } from "@/lib/availability";

// Shared "this isn't available yet" panel for any noun with the
// locked/released/scheduled lifecycle (classes, assessments, ...), reached
// either by direct URL or a plain-locked (no schedule) state.
export function LockedPanel({
  noun,
  name,
  scheduledPending,
  releaseAt,
}: {
  noun: string;
  name: string;
  scheduledPending: boolean;
  releaseAt?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-6">
      <Lock size={20} className="mt-0.5 shrink-0 text-slate-400" />
      <div>
        <p className="font-medium text-slate-900">This {noun} is locked</p>
        <p className="mt-1 text-sm text-slate-600">
          <span className="font-medium text-slate-700">{name}</span>{" "}
          {scheduledPending && releaseAt ? (
            <>unlocks on {formatReleaseDate(releaseAt)}.</>
          ) : (
            <>
              hasn&apos;t been released yet. It&apos;ll open here once Tanza
              makes it available.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
