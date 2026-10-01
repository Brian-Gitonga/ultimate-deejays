import type { ComponentType, SVGProps } from "react";
import { CheckIcon, ClockIcon, PencilIcon } from "../icons";

export type StatusKey = "published" | "review" | "draft";

// Status colors, validated for separation and contrast in both themes; always shown with an icon + label.
export const statusMeta: Record<StatusKey, { label: string; dot: string; pill: string; icon: ComponentType<SVGProps<SVGSVGElement>> }> = {
  published: {
    label: "Published",
    dot: "bg-[#00a76f] dark:bg-[#1fc389]",
    pill: "bg-[#00a76f]/10 text-[#007867] dark:text-[#1fc389]",
    icon: CheckIcon,
  },
  review: {
    label: "In review",
    dot: "bg-[#c98200] dark:bg-[#ffb938]",
    pill: "bg-[#c98200]/10 text-[#9a6400] dark:text-[#ffb938]",
    icon: ClockIcon,
  },
  draft: {
    label: "Draft",
    dot: "bg-[#737373]",
    pill: "bg-foreground/[0.07] text-foreground/75",
    icon: PencilIcon,
  },
};

export function StatusBadge({ status, label }: { status: StatusKey; label?: string }) {
  const meta = statusMeta[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${meta.pill}`}>
      <meta.icon className="size-3" strokeWidth={2.5} />
      {label ?? meta.label}
    </span>
  );
}
