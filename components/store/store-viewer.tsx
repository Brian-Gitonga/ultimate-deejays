"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getStoreViewer, type StoreViewer } from "@/app/(site)/store/actions";
import { canDownload, type StorePlan } from "@/lib/store";
import { useSignedIn } from "@/lib/use-signed-in";

/*
 * Who's looking at the store, asked once per page (and again after they sign
 * in or out, or download something), so cards and buttons know whether to say
 * "Log in", "Unlock" or "Download", and how many downloads are left. null
 * while it loads.
 */

const ViewerContext = createContext<StoreViewer | null>(null);
const RefreshContext = createContext<() => void>(() => {});

export function StoreViewerProvider({ children }: { children: ReactNode }) {
  const signedIn = useSignedIn();
  const [viewer, setViewer] = useState<StoreViewer | null>(null);
  // Bumped to ask again (the old answer stays up meanwhile).
  const [asked, setAsked] = useState(0);
  const refresh = useCallback(() => setAsked((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    getStoreViewer().then(
      (result) => !cancelled && setViewer(result),
      () => !cancelled && setViewer({ signedIn: false }),
    );
    return () => {
      cancelled = true;
    };
  }, [signedIn, asked]);

  return (
    <RefreshContext.Provider value={refresh}>
      <ViewerContext.Provider value={viewer}>{children}</ViewerContext.Provider>
    </RefreshContext.Provider>
  );
}

export const useStoreViewer = () => useContext(ViewerContext);
/** Ask again who's looking, e.g. after a download used one up. */
export const useRefreshStoreViewer = () => useContext(RefreshContext);

/** "loading" until we know; then whether this viewer can download a resource needing `access`. */
export function accessFor(viewer: StoreViewer | null, access: StorePlan): "loading" | "signin" | "locked" | "open" {
  if (!viewer) return "loading";
  if (!viewer.signedIn) return "signin";
  return canDownload(access, viewer.plan, viewer.isAdmin) ? "open" : "locked";
}
