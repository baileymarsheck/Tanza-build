"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import {
  datetimeLocalToIso,
  formatReleaseDateTime,
  isReleased,
  isoToDatetimeLocal,
  isScheduledPending,
} from "@/lib/availability";
import type { AvailabilityStatus } from "@/lib/types";
import { ConfirmDialog } from "@/components/confirm-dialog";

// Full admin availability control for a list row: a schedule-toggle button,
// the release/lock switch, an inline "goes live" bar once scheduled, and a
// confirmation gate before un-releasing something that's already live.
// Shared by the curriculum class list and the assessments list.
export function AvailabilityRow({
  status,
  releaseAt,
  itemLabel,
  onSchedule,
  onUnschedule,
  onChangeReleaseAt,
  onToggleRelease,
}: {
  status: AvailabilityStatus;
  releaseAt?: string | null;
  itemLabel: string;
  onSchedule: () => void;
  onUnschedule: () => void;
  onChangeReleaseAt: (iso: string | null) => void;
  onToggleRelease: () => void;
}) {
  const released = isReleased({ status, releaseAt });
  const scheduledPending = isScheduledPending({ status, releaseAt });
  const [confirmUnrelease, setConfirmUnrelease] = useState(false);
  const [editingDate, setEditingDate] = useState(false);

  // Releasing is one click; un-releasing something live asks first, since it
  // pulls it out from under fellows who may already be using it.
  function handleToggle() {
    if (released) {
      setConfirmUnrelease(true);
    } else {
      onToggleRelease();
    }
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={scheduledPending ? onUnschedule : onSchedule}
          disabled={released}
          aria-pressed={scheduledPending}
          title={
            released
              ? "Already released — unrelease it first to schedule"
              : scheduledPending
                ? "Cancel scheduled release"
                : "Schedule release"
          }
          className={`flex size-8 items-center justify-center rounded-lg border transition-colors ${
            released
              ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
              : scheduledPending
                ? "border-amber-300 bg-amber-50 text-amber-600"
                : "border-slate-300 text-slate-500 hover:bg-slate-100"
          }`}
        >
          <CalendarClock size={15} />
        </button>
        <ReleaseToggle released={released} onToggle={handleToggle} />
      </div>

      {scheduledPending && releaseAt && (
        <div className="mt-2 flex w-full flex-wrap items-center gap-2 rounded-lg bg-amber-50/60 px-3 py-2 text-sm">
          <CalendarClock size={15} className="shrink-0 text-amber-600" />
          {editingDate ? (
            <input
              type="datetime-local"
              autoFocus
              value={isoToDatetimeLocal(releaseAt)}
              onChange={(e) =>
                onChangeReleaseAt(datetimeLocalToIso(e.target.value))
              }
              onBlur={() => setEditingDate(false)}
              className="rounded-md border border-amber-200 bg-white px-2 py-1 text-sm text-slate-800 focus:border-brand-orange focus:outline-none"
            />
          ) : (
            <>
              <span className="font-medium text-amber-800">
                Releases {formatReleaseDateTime(releaseAt)}
              </span>
              <button
                type="button"
                onClick={() => setEditingDate(true)}
                className="text-xs font-medium text-brand-navy hover:text-brand-orange"
              >
                Change
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onUnschedule}
            className="ml-auto text-xs font-medium text-amber-600 hover:text-amber-800"
          >
            Unschedule
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmUnrelease}
        title="Unrelease this?"
        message={`"${itemLabel}" is currently visible to fellows. Unreleasing it will hide it from them — including anyone already working through it.`}
        confirmLabel="Unrelease"
        destructive
        onConfirm={() => {
          onToggleRelease();
          setConfirmUnrelease(false);
        }}
        onCancel={() => setConfirmUnrelease(false)}
      />
    </>
  );
}

// Accessible switch for releasing / locking.
function ReleaseToggle({
  released,
  onToggle,
}: {
  released: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={released}
      onClick={onToggle}
      title={released ? "Lock (hide from fellows)" : "Release to fellows"}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        released ? "bg-emerald-500" : "bg-slate-300"
      }`}
    >
      <span className="sr-only">{released ? "Locked" : "Released"} — toggle</span>
      <span
        className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
          released ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
