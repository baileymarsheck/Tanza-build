import {
  BookOpen,
  ClipboardList,
  FileCheck,
  Home,
  type LucideIcon,
  PlayCircle,
  Settings,
  TrendingUp,
} from "lucide-react";
import type { Role } from "@/lib/types";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
  description: string;
}

// Single source of truth for the sidebar. Adding a future feature area means
// adding one entry here — no layout or routing code needs to change.
export const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["admin", "fellow"],
    description: "An overview tailored to the signed-in role.",
  },
  {
    id: "curriculum",
    label: "Curriculum",
    href: "/curriculum",
    icon: BookOpen,
    roles: ["admin"],
    description:
      "Create and edit modules and classes, upload resources and toolkits, and manage class release schedules.",
  },
  {
    id: "classes",
    label: "My Classes",
    href: "/classes",
    icon: PlayCircle,
    roles: ["fellow"],
    description:
      "Recordings, transcripts, notes, and resources for each class as it's released.",
  },
  {
    id: "assessments",
    label: "Assessments",
    href: "/assessments",
    icon: ClipboardList,
    roles: ["admin", "fellow"],
    description:
      "Multiple-choice and short-answer assessments, and practical case study submissions.",
  },
  {
    id: "performance",
    label: "Performance",
    href: "/performance",
    icon: TrendingUp,
    roles: ["admin", "fellow"],
    description:
      "Technical, Strategic, and Leadership Aptitude tracked over time — for a fellow or across the cohort.",
  },
  {
    id: "submissions",
    label: "Submissions Review",
    href: "/submissions",
    icon: FileCheck,
    roles: ["admin"],
    description:
      "Review case study and assessment submissions, and leave written feedback.",
  },
  {
    id: "competencies",
    label: "Competencies & Config",
    href: "/competencies",
    icon: Settings,
    roles: ["admin"],
    description:
      "Manage competencies, aptitude weightings, and learning pathways without touching application code.",
  },
];
