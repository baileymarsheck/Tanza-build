"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

// Baked-in fallback so the app shell is demoable with zero setup, before a
// Supabase project has been created and connected. IDs match the seed rows
// in supabase/schema.sql so switching between fallback and real data is
// seamless once Supabase is wired up.
const FALLBACK_PROFILES: Profile[] = [
  { id: "00000000-0000-0000-0000-000000000001", name: "Jenny Mrema", role: "admin" },
  { id: "00000000-0000-0000-0000-000000000002", name: "Amina Hassan", role: "fellow" },
  { id: "00000000-0000-0000-0000-000000000003", name: "David Mushi", role: "fellow" },
];

const ACTIVE_PROFILE_STORAGE_KEY = "tanza:active-profile-id";

interface CurrentProfileContextValue {
  profile: Profile;
  allProfiles: Profile[];
  setActiveProfile: (id: string) => void;
  isUsingFallbackData: boolean;
}

const CurrentProfileContext = createContext<CurrentProfileContextValue | null>(
  null
);

export function CurrentProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [allProfiles, setAllProfiles] = useState<Profile[]>(FALLBACK_PROFILES);
  const [isUsingFallbackData, setIsUsingFallbackData] = useState(true);
  const [activeProfileId, setActiveProfileId] = useState(
    FALLBACK_PROFILES[0].id
  );

  useEffect(() => {
    const storedId = window.localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY);
    if (storedId) {
      setActiveProfileId(storedId);
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    supabase
      .from("profiles")
      .select("id, name, role")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) {
          return;
        }
        setAllProfiles(data as Profile[]);
        setIsUsingFallbackData(false);
      });
  }, []);

  const setActiveProfile = (id: string) => {
    setActiveProfileId(id);
    window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, id);
  };

  const profile = useMemo(
    () =>
      allProfiles.find((p) => p.id === activeProfileId) ?? allProfiles[0],
    [allProfiles, activeProfileId]
  );

  const value = useMemo(
    () => ({ profile, allProfiles, setActiveProfile, isUsingFallbackData }),
    [profile, allProfiles, isUsingFallbackData]
  );

  return (
    <CurrentProfileContext.Provider value={value}>
      {children}
    </CurrentProfileContext.Provider>
  );
}

export function useCurrentProfile() {
  const context = useContext(CurrentProfileContext);
  if (!context) {
    throw new Error(
      "useCurrentProfile must be used within a CurrentProfileProvider"
    );
  }
  return context;
}
