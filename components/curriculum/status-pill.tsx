import { Lock, Unlock } from "lucide-react";
import type { ClassStatus } from "@/lib/types";

// Shared between the admin manager and the fellow browser so "released" and
// "locked" always read the same way across the app.
export function StatusPill({ status }: { status: ClassStatus }) {
  if (status === "released") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <Unlock size={12} />
        Released
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
