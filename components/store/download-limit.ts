import { useState, useSyncExternalStore } from "react";
import type { StoreViewer } from "@/app/(site)/store/actions";
import { left, type MyAllowance } from "@/lib/allowances";
import type { UpgradeReason } from "@/lib/upgrade";

/*
 * Download allowances on the store's buttons: a member with no downloads left
 * keeps the same buttons, and tapping one explains why (components/upgrade).
 * Shared by the template page and the grid.
 */

/* The download route sends people back with #limit when it refuses for want of downloads. */
const onHashChange = (listener: () => void) => {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
};

/** Whether the download route just sent them back (#limit), and a way to put that away once explained. */
export function useLimitBounce(): [boolean, () => void] {
  const hit = useSyncExternalStore(onHashChange, () => window.location.hash === "#limit", () => false);
  const [dismissed, setDismissed] = useState(false);
  const dismiss = () => {
    setDismissed(true);
    if (window.location.hash === "#limit") window.history.replaceState(null, "", window.location.pathname + window.location.search);
  };
  return [hit && !dismissed, dismiss];
}

/** The allowance that applies to this viewer: signed in and not an admin. */
export const limitedAllowance = (viewer: StoreViewer | null) => (viewer?.signedIn && viewer.allowance && !viewer.allowance.admin ? viewer.allowance : null);

/** Why this member can't download right now, if they can't. `bounced`: the download route sent them back, which beats our count. */
export function downloadBlock(allowance: MyAllowance | null, bounced: boolean): UpgradeReason | null {
  const d = allowance?.downloads;
  if (!allowance || !d) return null;
  if (d.limit === 0) return { kind: "downloads-none" };
  if (d.limit === null || (left(d) > 0 && !bounced)) return null;
  return { kind: "downloads-used", limit: d.limit, period: allowance.period, resetsAt: allowance.resetsAt };
}
