import type { ReferralStatus } from "@/lib/affiliate-portal";
import { CheckIcon, ClockIcon, RefundIcon, WalletIcon } from "../icons";
import { statusMeta } from "../studio/status";

// Commission states, using the studio status colours; each badge carries an icon and a label.
export const referralStatus: Record<ReferralStatus, { label: string; hint: string; pill: string; icon: typeof CheckIcon }> = {
  pending: { label: "Pending", hint: "Inside the refund window, so it can't be paid yet", pill: statusMeta.review.pill, icon: ClockIcon },
  approved: { label: "Cleared", hint: "Refund window has passed; included in the next payout", pill: statusMeta.published.pill, icon: CheckIcon },
  paid: { label: "Paid", hint: "Sent to you in a payout", pill: statusMeta.draft.pill, icon: WalletIcon },
  refunded: { label: "Refunded", hint: "The student got their money back, so there's no commission", pill: "bg-red-500/10 text-red-700 dark:text-red-400", icon: RefundIcon },
};

export function ReferralStatusBadge({ status }: { status: ReferralStatus }) {
  const s = referralStatus[status];
  return (
    <span title={s.hint} className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${s.pill}`}>
      <s.icon className="size-3" strokeWidth={2.5} />
      {s.label}
    </span>
  );
}
