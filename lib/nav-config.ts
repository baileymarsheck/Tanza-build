import {
  BookOpen,
  ClipboardList,
  FileCheck,
  GraduationCap,
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
  // When true, clicking this item in the sidebar opens a slide-out panel
  // (label + description + an explicit "Open" link) instead of navigating
  // immediately — the Canvas-style pattern. Items without it (e.g.
  // Dashboard) navigate straight to their route, since there's nothing to
  // preview first.
  hasFlyout?: boolean;
  // When true, the item is kept out of the sidebar list entirely (reached
  // instead via another item's flyout menu) but still counts for the
  // topbar title / active-route matching below.
  hiddenFromSidebar?: boolean;
}

// Single source of truth for the sidebar. Adding a future feature area means
// adding one entry here — no layout or routing code needs to change.
export const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Home Dashboard",
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
    hasFlyout: true,
  },
  {
    id: "classes",
    label: "My Classes",
    href: "/classes",
    icon: PlayCircle,
    roles: ["fellow"],
    description:
      "Recordings, transcripts, notes, and resources for each class as it's released.",
    hasFlyout: true,
  },
  {
    id: "assessments",
    label: "Assessments",
    href: "/assessments",
    icon: ClipboardList,
    roles: ["admin", "fellow"],
    description:
      "Multiple-choice and short-answer assessments, and practical case study submissions.",
    hasFlyout: true,
  },
  {
    id: "performance",
    label: "Performance",
    href: "/performance",
    icon: TrendingUp,
    roles: ["admin", "fellow"],
    description:
      "Technical, Strategic, and Leadership Aptitude tracked over time — for a fellow or across the cohort.",
    hasFlyout: true,
  },
  {
    id: "cohort",
    label: "Fellow Cohort",
    href: "/performance/cohort",
    icon: GraduationCap,
    roles: ["admin"],
    description:
      "See each fellow's assessment completion, scores, and feedback at a glance.",
    // Reached via the Performance flyout instead of its own sidebar entry.
    hiddenFromSidebar: true,
  },
  {
    id: "submissions",
    label: "Submissions Review",
    href: "/submissions",
    icon: FileCheck,
    roles: ["admin"],
    description:
      "Review case study and assessment submissions, and leave written feedback.",
    // Reached via the Assessments flyout instead of its own sidebar entry.
    hiddenFromSidebar: true,
  },
  {
    id: "competencies",
    label: "Configurations",
    href: "/competencies",
    icon: Settings,
    roles: ["admin"],
    description:
      "Manage competencies, aptitude weightings, and learning pathways without touching application code.",
    hasFlyout: true,
  },
];

// Matches the current route to a nav item: exact match, or a nested route
// under it (e.g. /assessments/123). Avoids the prefix collision that a bare
// startsWith would cause between sibling routes sharing a prefix.
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function getActiveNavItem(pathname: string): NavItem | undefined {
  const matches = NAV_ITEMS.filter((item) => isNavItemActive(item, pathname));
  if (matches.length === 0) return undefined;

  // When a route matches more than one item (e.g. /performance/cohort
  // matches both "cohort" and its parent "performance"), the most specific
  // (longest href) one wins, regardless of array order.
  return matches.reduce((best, item) =>
    item.href.length > best.href.length ? item : best
  );
}
