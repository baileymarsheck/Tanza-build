import {
  datetimeLocalToIso,
  defaultScheduleIso,
  isoToDatetimeLocal,
} from "@/lib/availability";
import type { AvailabilityStatus } from "@/lib/types";

// The released/locked/scheduled select + conditional datetime-local input,
// shared by the class and assessment editors. No label/hint wrapper here —
// callers wrap this in their own <Field> so the hint copy can vary.
export function AvailabilityField({
  status,
  releaseAt,
  onChange,
}: {
  status: AvailabilityStatus;
  releaseAt?: string | null;
  onChange: (patch: { status: AvailabilityStatus; releaseAt: string | null }) => void;
}) {
  function setMode(mode: AvailabilityStatus) {
    if (mode === "scheduled") {
      onChange({ status: "scheduled", releaseAt: releaseAt ?? defaultScheduleIso() });
    } else {
      onChange({ status: mode, releaseAt: null });
    }
  }

  return (
    <>
      <select
        value={status}
        onChange={(e) => setMode(e.target.value as AvailabilityStatus)}
        className="input"
      >
        <option value="released">Released now</option>
        <option value="locked">Locked</option>
        <option value="scheduled">Scheduled…</option>
      </select>
      {status === "scheduled" && (
        <input
          type="datetime-local"
          value={isoToDatetimeLocal(releaseAt)}
          onChange={(e) =>
            onChange({ status: "scheduled", releaseAt: datetimeLocalToIso(e.target.value) })
          }
          className="input mt-2"
        />
      )}
    </>
  );
}
