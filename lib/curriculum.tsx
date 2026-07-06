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
import { createClient } from "@/lib/supabase/client";
import type {
  ClassRecord,
  ClassResource,
  ClassVideo,
  ModuleWithClasses,
} from "@/lib/types";

type Supabase = NonNullable<ReturnType<typeof createClient>>;

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
  deleteClass: (classId: string) => void;
  addModule: () => void;
  resetToSample: () => void;
}

const CurriculumContext = createContext<CurriculumContextValue | null>(null);

// Raw shape of a nested `modules` select (see the fetch below) — snake_case
// columns straight off the wire, reshaped into ModuleWithClasses by
// reshapeModules.
interface ModuleRow {
  id: string;
  title: string;
  description: string;
  classes: {
    id: string;
    title: string;
    summary: string;
    status: ClassRecord["status"];
    release_at: string | null;
    notes: string;
    transcript: string;
    class_resources: { id: string; label: string; url: string; kind: ClassResource["kind"] }[];
    class_videos: { id: string; title: string; url: string }[];
  }[];
}

function reshapeModules(rows: ModuleRow[]): ModuleWithClasses[] {
  return rows.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    classes: (m.classes ?? []).map((c) => ({
      id: c.id,
      moduleId: m.id,
      title: c.title,
      summary: c.summary,
      status: c.status,
      releaseAt: c.release_at,
      notes: c.notes,
      transcript: c.transcript,
      resources: (c.class_resources ?? []).map((r) => ({
        id: r.id,
        label: r.label,
        url: r.url,
        kind: r.kind,
      })),
      videos: (c.class_videos ?? []).map((v) => ({
        id: v.id,
        title: v.title,
        url: v.url,
      })),
    })),
  }));
}

// class_resources/class_videos are separate tables, not JSON columns, so an
// updateClass({ resources }) / updateClass({ videos }) patch (the class
// editor always sends the whole desired array) is applied as a diff: delete
// rows that dropped out, upsert the rest with a fresh position.
async function syncClassResources(
  supabase: Supabase,
  classId: string,
  resources: ClassResource[]
) {
  const { data: existing } = await supabase
    .from("class_resources")
    .select("id")
    .eq("class_id", classId);
  const nextIds = new Set(resources.map((r) => r.id));
  const toDelete = (existing ?? [])
    .map((r) => r.id as string)
    .filter((id) => !nextIds.has(id));
  if (toDelete.length > 0) {
    await supabase.from("class_resources").delete().in("id", toDelete);
  }
  if (resources.length > 0) {
    await supabase.from("class_resources").upsert(
      resources.map((r, i) => ({
        id: r.id,
        class_id: classId,
        label: r.label,
        url: r.url,
        kind: r.kind,
        position: i,
      }))
    );
  }
}

async function syncClassVideos(
  supabase: Supabase,
  classId: string,
  videos: ClassVideo[]
) {
  const { data: existing } = await supabase
    .from("class_videos")
    .select("id")
    .eq("class_id", classId);
  const nextIds = new Set(videos.map((v) => v.id));
  const toDelete = (existing ?? [])
    .map((v) => v.id as string)
    .filter((id) => !nextIds.has(id));
  if (toDelete.length > 0) {
    await supabase.from("class_videos").delete().in("id", toDelete);
  }
  if (videos.length > 0) {
    await supabase.from("class_videos").upsert(
      videos.map((v, i) => ({
        id: v.id,
        class_id: classId,
        title: v.title,
        url: v.url,
        position: i,
      }))
    );
  }
}

// Every action below follows the same shape: update React state (and the
// localStorage mirror) optimistically first — unchanged from before, so the
// UI feels identical either way — then fire the matching Supabase call in
// the background when a project is connected. A failed/absent Supabase call
// just means the change doesn't outlive this browser session, same as any
// other localStorage write failure already silently tolerated elsewhere.
export function CurriculumProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [modules, setModules] = useState<ModuleWithClasses[]>(SEED_CURRICULUM);

  useEffect(() => {
    const supabase = createClient();
    if (supabase) {
      (async () => {
        try {
          const { data, error } = await supabase
            .from("modules")
            .select(
              `id, title, description,
               classes (
                 id, title, summary, status, release_at, notes, transcript,
                 class_resources ( id, label, url, kind, position ),
                 class_videos ( id, title, url, position )
               )`
            )
            .order("position", { ascending: true })
            .order("position", { referencedTable: "classes", ascending: true })
            .order("position", {
              referencedTable: "classes.class_resources",
              ascending: true,
            })
            .order("position", {
              referencedTable: "classes.class_videos",
              ascending: true,
            });

          if (!error && data && data.length > 0) {
            setModules(reshapeModules(data as unknown as ModuleRow[]));
            return;
          }
        } catch {
          // Network failure — fall through to the localStorage fallback.
        }
        loadFromLocalStorage();
      })();
      return;
    }

    loadFromLocalStorage();

    function loadFromLocalStorage() {
      const stored = getStoredItem(CURRICULUM_STORAGE_KEY);
      if (stored) {
        try {
          setModules(JSON.parse(stored) as ModuleWithClasses[]);
        } catch {
          // Corrupt storage — keep the seed.
        }
      }
    }
  }, []);

  // Persist every change locally so admin edits survive a refresh even
  // without Supabase connected.
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
      let nextStatus: ClassRecord["status"] = "locked";
      mapClass(classId, (c) => {
        nextStatus = isReleased(c) ? "locked" : "released";
        return { ...c, status: nextStatus, releaseAt: null };
      });

      const supabase = createClient();
      if (supabase) {
        supabase
          .from("classes")
          .update({ status: nextStatus, release_at: null })
          .eq("id", classId)
          .then();
      }
    },
    [mapClass]
  );

  const updateClass = useCallback(
    (classId: string, patch: Partial<ClassRecord>) => {
      mapClass(classId, (c) => ({ ...c, ...patch }));

      const supabase = createClient();
      if (!supabase) return;

      const { resources, videos, releaseAt, ...rest } = patch;
      const columnPatch: Record<string, unknown> = { ...rest };
      if ("releaseAt" in patch) columnPatch.release_at = releaseAt ?? null;

      (async () => {
        if (Object.keys(columnPatch).length > 0) {
          await supabase.from("classes").update(columnPatch).eq("id", classId);
        }
        if (resources) await syncClassResources(supabase, classId, resources);
        if (videos) await syncClassVideos(supabase, classId, videos);
      })();
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
      const targetModule = modules.find((m) => m.id === moduleId);
      commit(
        modules.map((module) =>
          module.id === moduleId
            ? { ...module, classes: [...module.classes, klass] }
            : module
        )
      );

      const supabase = createClient();
      if (supabase) {
        supabase
          .from("classes")
          .insert({
            id: klass.id,
            module_id: moduleId,
            title: klass.title,
            summary: klass.summary,
            status: klass.status,
            notes: klass.notes,
            transcript: klass.transcript,
            position: targetModule?.classes.length ?? 0,
          })
          .then();
      }

      return klass;
    },
    [modules, commit]
  );

  const deleteClass = useCallback(
    (classId: string) => {
      commit(
        modules.map((module) => ({
          ...module,
          classes: module.classes.filter((c) => c.id !== classId),
        }))
      );

      const supabase = createClient();
      if (supabase) {
        supabase.from("classes").delete().eq("id", classId).then();
      }
    },
    [modules, commit]
  );

  const addModule = useCallback(() => {
    const newModule = {
      id: makeId("mod"),
      title: "Untitled module",
      description: "",
      classes: [],
    };
    commit([...modules, newModule]);

    const supabase = createClient();
    if (supabase) {
      supabase
        .from("modules")
        .insert({
          id: newModule.id,
          title: newModule.title,
          description: newModule.description,
          position: modules.length,
        })
        .then();
    }
  }, [modules, commit]);

  const resetToSample = useCallback(() => {
    commit(SEED_CURRICULUM);

    const supabase = createClient();
    if (!supabase) return;

    // Destructive: wipes every module/class (and, via cascade, every
    // resource/video/assessment/attempt) and reinserts the seed. Acceptable
    // for this single-tenant demo scaffold — this button exists precisely
    // to blow away whatever's there.
    (async () => {
      await supabase.from("modules").delete().neq("id", "");
      for (const [moduleIndex, module] of SEED_CURRICULUM.entries()) {
        await supabase.from("modules").insert({
          id: module.id,
          title: module.title,
          description: module.description,
          position: moduleIndex,
        });
        for (const [classIndex, klass] of module.classes.entries()) {
          await supabase.from("classes").insert({
            id: klass.id,
            module_id: module.id,
            title: klass.title,
            summary: klass.summary,
            status: klass.status,
            release_at: klass.releaseAt ?? null,
            notes: klass.notes,
            transcript: klass.transcript,
            position: classIndex,
          });
          if (klass.resources.length > 0) {
            await supabase.from("class_resources").insert(
              klass.resources.map((r, i) => ({
                id: r.id,
                class_id: klass.id,
                label: r.label,
                url: r.url,
                kind: r.kind,
                position: i,
              }))
            );
          }
          if (klass.videos && klass.videos.length > 0) {
            await supabase.from("class_videos").insert(
              klass.videos.map((v, i) => ({
                id: v.id,
                class_id: klass.id,
                title: v.title,
                url: v.url,
                position: i,
              }))
            );
          }
        }
      }
    })();
  }, [commit]);

  const value = useMemo(
    () => ({
      modules,
      getClass,
      toggleClassStatus,
      updateClass,
      addClass,
      deleteClass,
      addModule,
      resetToSample,
    }),
    [
      modules,
      getClass,
      toggleClassStatus,
      updateClass,
      addClass,
      deleteClass,
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
