"use server";

import type { MyAllowance } from "@/lib/allowances";
import { getViewer } from "@/lib/dal";
import { getMyAllowance } from "@/lib/db/allowances";
import type { StorePlan } from "@/lib/store";

/*
 * The store pages are cached and the same for everyone, so once they load
 * they ask who's looking, to show the right button: log in, upgrade, or
 * download, and how many downloads they have left. The download route
 * checks again; this is only for the buttons.
 */

export type StoreViewer =
  | { signedIn: false }
  | { signedIn: true; id: string; plan: StorePlan; isAdmin: boolean; allowance: MyAllowance | null; /** Saved for edit texts, +254… or "" */ phone: string };

export async function getStoreViewer(): Promise<StoreViewer> {
  const viewer = await getViewer();
  if (!viewer || viewer.status === "suspended") return { signedIn: false };
  return { signedIn: true, id: viewer.id, plan: viewer.plan, isAdmin: viewer.role === "admin", allowance: await getMyAllowance(), phone: viewer.profile.phone };
}
