import type { LucideIcon } from "lucide-react";

export function StatTile({
  label,
  value,
  icon: Icon,
  progress,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  progress?: number;
}) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 p-4">
      <div className="flex size-8 items-center justify-center rounded-full bg-white/10">
        <Icon size={16} strokeWidth={1.75} className="text-brand-orange" />
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-0.5 text-sm text-white/60">{label}</p>
      {progress !== undefined && (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-brand-orange"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}
