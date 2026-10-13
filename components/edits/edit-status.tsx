import { memberStatusLabel, studioStatusLabel, type EditStatus } from "@/lib/edits";

const tone: Record<EditStatus, string> = {
  submitted: "bg-foreground/[0.07] text-foreground",
  in_progress: "bg-accent-blue/10 text-accent-blue dark:text-[#8db4ff]",
  needs_info: "bg-accent-amber/15 text-[#9a6400] dark:text-accent-amber",
  delivered: "bg-brand/10 text-brand-deep dark:text-brand",
  declined: "bg-red-500/10 text-red-700 dark:text-red-300",
  cancelled: "bg-foreground/[0.05] text-muted-foreground",
};

/* An edit request's status, worded for the member or for the team. */
export function EditStatusChip({ status, audience = "member" }: { status: EditStatus; audience?: "member" | "studio" }) {
  const label = (audience === "studio" ? studioStatusLabel : memberStatusLabel)[status] ?? status;
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${tone[status] ?? tone.submitted}`}>{label}</span>;
}
