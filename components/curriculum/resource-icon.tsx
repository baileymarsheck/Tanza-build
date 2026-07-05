import {
  BookText,
  FileText,
  LinkIcon,
  type LucideIcon,
  Presentation,
  Wrench,
} from "lucide-react";
import type { ResourceKind } from "@/lib/types";

const ICONS: Record<ResourceKind, LucideIcon> = {
  template: FileText,
  toolkit: Wrench,
  reading: BookText,
  slides: Presentation,
  link: LinkIcon,
};

export function ResourceIcon({
  kind,
  size = 16,
}: {
  kind: ResourceKind;
  size?: number;
}) {
  const Icon = ICONS[kind] ?? LinkIcon;
  return <Icon size={size} strokeWidth={1.75} />;
}
