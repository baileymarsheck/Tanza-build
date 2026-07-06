"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CURRICULUM_STORAGE_KEY,
  SEED_CURRICULUM,
} from "@/lib/curriculum-data";
import { isReleased } from "@/lib/availability";
import { makeId } from "@/lib/id";
import { getStoredItem, setStoredItem } from "@/lib/storage";
import type {
  ClassRecord,
  ClassResource,
  ModuleWithClasses,
} from "@/lib/types";

interface FoundClass {
  module: ModuleWithClasses;
  klass: ClassRecord;
}

interface CurriculumContextValue {
  modules: ModuleWithClasses[];
  getClass: (classId: string) => FoundClass | null;
  toggleClassStatus: (classId: string) => void;
  updateClass: (classId: string, patch: Partial<ClassRecord>) => void;
  addClass: (moduleId: string) => ClassRecord;
  addModule: () => void;
  resetToSample: () => void;
}

const CurriculumContext = createContext<CurriculumContextValue | null>(null);

// A future Supabase-backed implementation would swap the localStorage read/
// write below for queries against the modules / classes / class_resources
// tables — the context surface (modules + these actions) stays the same, so
// nothing consuming useCurriculum() would change.
export function CurriculumProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [modules, setModules] = useState<ModuleWithClasses[]>(SEED_CURRICULUM);

  // Load any admin edits from a previous session. Runs client-side only, so
  // the first render matches the server (seed) and there's no hydration gap.
  useEffect(() => {
    const stored = getStoredItem(CURRICULUM_STORAGE_KEY);
    if (stored) {
      try {
        setModules(JSON.parse(stored) as ModuleWithClasses[]);
      } catch {
        // Corrupt storage — keep the seed.
      }
    }
  }, []);

  // Persist every change so admin edits survive a refresh.
  const commit = useCallback((next: ModuleWithClasses[]) => {
    setModules(next);
    setStoredItem(CURRICULUM_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const getClass = useCallback(
    (classId: string): FoundClass | null => {
      for (const module of modules) {
        const klass = module.classes.find((c) => c.id === classId);
        if (klass) return { module, klass };
      }
      return null;
    },
    [modules]
  );

  const mapClass = useCallback(
    (classId: string, fn: (c: ClassRecord) => ClassRecord) => {
      commit(
        modules.map((module) => ({
          ...module,
          classes: module.classes.map((c) => (c.id === classId ? fn(c) : c)),
        }))
      );
    },
    [modules, commit]
  );

  // Manual toggle: flip the class's *effective* released state and commit it
  // as a manual choice, clearing any schedule (manual always overrides).
  const toggleClassStatus = useCallback(
    (classId: string) => {
      mapClass(classId, (c) => ({
        ...c,
        status: isReleased(c) ? "locked" : "released",
        releaseAt: null,
      }));
    },
    [mapClass]
  );

  const updateClass = useCallback(
    (classId: string, patch: Partial<ClassRecord>) => {
      mapClass(classId, (c) => ({ ...c, ...patch }));
    },
    [mapClass]
  );

  const addClass = useCallback(
    (moduleId: string) => {
      const klass: ClassRecord = {
        id: makeId("cls"),
        moduleId,
        title: "Untitled class",
        summary: "",
        status: "locked",
        notes: "",
        transcript: "",
        resources: [] as ClassResource[],
      };
      commit(
        modules.map((module) =>
          module.id === moduleId
            ? { ...module, classes: [...module.classes, klass] }
            : module
        )
      );
      return klass;
    },
    [modules, commit]
  );

  const addModule = useCallback(() => {
    commit([
      ...modules,
      {
        id: makeId("mod"),
        title: "Untitled module",
        description: "",
        classes: [],
      },
    ]);
  }, [modules, commit]);

  const resetToSample = useCallback(() => {
    commit(SEED_CURRICULUM);
  }, [commit]);

  const value = useMemo(
    () => ({
      modules,
      getClass,
      toggleClassStatus,
      updateClass,
      addClass,
      addModule,
      resetToSample,
    }),
    [
      modules,
      getClass,
      toggleClassStatus,
      updateClass,
      addClass,
      addModule,
      resetToSample,
    ]
  );

  return (
    <CurriculumContext.Provider value={value}>
      {children}
    </CurriculumContext.Provider>
  );
}

export function useCurriculum() {
  const context = useContext(CurriculumContext);
  if (!context) {
    throw new Error("useCurriculum must be used within a CurriculumProvider");
  }
  return context;
}
