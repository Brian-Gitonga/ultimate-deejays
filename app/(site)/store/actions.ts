"use server";

import { getViewer } from "@/lib/dal";
import type { StorePlan } from "@/lib/store";

/*
 * The store pages are cached and the same for everyone, so once they load
 * they ask who's looking, to show the right button: log in, upgrade, or
 * download. The download route checks again; this is only for the buttons.
 */

export type StoreViewer = { signedIn: false } | { signedIn: true; plan: StorePlan; isAdmin: boolean };

export async function getStoreViewer(): Promise<StoreViewer> {
  const viewer = await getViewer();
  if (!viewer || viewer.status === "suspended") return { signedIn: false };
  return { signedIn: true, plan: viewer.plan, isAdmin: viewer.role === "admin" };
}
