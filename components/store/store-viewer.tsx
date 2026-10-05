"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getStoreViewer, type StoreViewer } from "@/app/(site)/store/actions";
import { canDownload, type StorePlan } from "@/lib/store";
import { useSignedIn } from "@/lib/use-signed-in";

/*
 * Who's looking at the store, asked once per page (and again after they sign
 * in or out), so cards and buttons know whether to say "Log in", "Unlock" or
 * "Download". null while it loads.
 */

const ViewerContext = createContext<StoreViewer | null>(null);

export function StoreViewerProvider({ children }: { children: ReactNode }) {
  const signedIn = useSignedIn();
  const [viewer, setViewer] = useState<StoreViewer | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStoreViewer().then(
      (result) => !cancelled && setViewer(result),
      () => !cancelled && setViewer({ signedIn: false }),
    );
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  return <ViewerContext.Provider value={viewer}>{children}</ViewerContext.Provider>;
}

export const useStoreViewer = () => useContext(ViewerContext);

/** "loading" until we know; then whether this viewer can download a resource needing `access`. */
export function accessFor(viewer: StoreViewer | null, access: StorePlan): "loading" | "signin" | "locked" | "open" {
  if (!viewer) return "loading";
  if (!viewer.signedIn) return "signin";
  return canDownload(access, viewer.plan, viewer.isAdmin) ? "open" : "locked";
}
