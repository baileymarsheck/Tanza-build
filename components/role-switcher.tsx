"use client";

import { useCurrentProfile } from "@/lib/current-profile";

export function RoleSwitcher() {
  const { profile, allProfiles, setActiveProfile, isUsingFallbackData } =
    useCurrentProfile();

  return (
    <div className="border-b border-white/10 p-4">
      <label
        htmlFor="role-switcher"
        className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50"
      >
        Viewing as
      </label>
      <select
        id="role-switcher"
        value={profile.id}
        onChange={(e) => setActiveProfile(e.target.value)}
        className="w-full rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
      >
        {allProfiles.map((p) => (
          <option key={p.id} value={p.id} className="text-brand-navy">
            {p.name} — {p.role === "admin" ? "Admin" : "Fellow"}
          </option>
        ))}
      </select>
      {isUsingFallbackData && (
        <p className="mt-1.5 text-[11px] leading-snug text-white/40">
          Using sample profiles — connect Supabase to use real data.
        </p>
      )}
    </div>
  );
}
