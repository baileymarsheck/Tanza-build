"use client";

import { useCurrentProfile } from "@/lib/current-profile";

export function RoleSwitcher() {
  const { profile, allProfiles, setActiveProfile, isUsingFallbackData } =
    useCurrentProfile();

  return (
    <div className="border-b border-slate-800 p-4">
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
        Viewing as
      </label>
      <select
        value={profile.id}
        onChange={(e) => setActiveProfile(e.target.value)}
        className="w-full rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        {allProfiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} — {p.role === "admin" ? "Admin" : "Fellow"}
          </option>
        ))}
      </select>
      {isUsingFallbackData && (
        <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
          Using sample profiles — connect Supabase to use real data.
        </p>
      )}
    </div>
  );
}
