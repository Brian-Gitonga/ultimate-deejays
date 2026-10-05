"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
 * Per-browser preferences (on/off toggles like a collapsed sidebar or email
 * notification choices) and the avatar resizer used by the profile form.
 * The profile itself lives in Supabase: see lib/profile.ts and lib/dal.ts.
 */

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** An on/off preference saved in this browser (e.g. email notifications). */
export function useToggleSetting(name: string, fallback: boolean) {
  const key = `ud:setting:${name}`;
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const value = raw === null ? fallback : raw === "1";
  const set = useCallback(
    (next: boolean) => {
      try {
        localStorage.setItem(key, next ? "1" : "0");
      } catch {
        // Not persisted when storage is blocked.
      }
      listeners.forEach((l) => l());
    },
    [key],
  );
  return [value, set] as const;
}

/** Resizes an image file to a square JPEG data URL (for the avatar). */
export async function fileToAvatar(file: File, size = 256): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  canvas.getContext("2d")!.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}
