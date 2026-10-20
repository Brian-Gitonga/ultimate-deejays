import { preconnect } from "react-dom";
import { r2Origin } from "@/lib/storage.server";

/*
 * Opens the connection to Cloudflare R2 while the page loads, on pages that
 * show preview clips, so the first clip doesn't wait for DNS and TLS. Renders
 * nothing.
 */
export function MediaPreconnect({ when = true }: { when?: boolean }) {
  const origin = when ? r2Origin() : null;
  if (origin) preconnect(origin);
  return null;
}
