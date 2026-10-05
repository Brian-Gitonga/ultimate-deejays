"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import type { ActionResult } from "./action-result";

/*
 * Studio collections (courses, posts, challenges, students…), backed by the
 * database. Each manager gets the server's rows as `seed` and the Server
 * Actions that change them. Edits show instantly (optimistic), are rolled
 * back if the server refuses them, and any failure appears in the studio's
 * error banner. When the server re-renders with fresh rows (after every
 * save), they replace the local copy.
 */

// ── Error banner ───────────────────────────────────────────────────────────

let notices: { id: number; message: string }[] = [];
let nextId = 1;
const noticeListeners = new Set<() => void>();
const emitNotices = () => noticeListeners.forEach((l) => l());

/** Shows an error in the studio banner (rendered by <StudioNotices /> in the shell). */
export function reportStudioError(message: string) {
  const id = nextId++;
  notices = [...notices, { id, message }];
  emitNotices();
  setTimeout(() => dismissStudioError(id), 12_000);
}

export function dismissStudioError(id: number) {
  notices = notices.filter((n) => n.id !== id);
  emitNotices();
}

export function useStudioNotices() {
  return useSyncExternalStore(
    (listener) => {
      noticeListeners.add(listener);
      return () => noticeListeners.delete(listener);
    },
    () => notices,
    () => notices,
  );
}

const unreachable = "We couldn't reach the server. Check your connection and try again.";

/** Runs a Server Action, showing any failure in the banner. */
export async function runAction<T>(action: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  const result = await action().catch((): ActionResult<T> => ({ ok: false, error: unreachable }));
  if (!result.ok) reportStudioError(result.error);
  return result;
}

// ── Collections ────────────────────────────────────────────────────────────

type Ops<T> = {
  save?: (item: T) => Promise<ActionResult<T>>;
  remove?: (id: string) => Promise<ActionResult<unknown>>;
};

export function useServerCollection<T extends { id: string }>(seed: T[], ops: Ops<T>) {
  const [items, setItems] = useState(seed);
  const [seen, setSeen] = useState(seed);
  // Fresh rows from the server replace the local copy.
  if (seed !== seen) {
    setSeen(seed);
    setItems(seed);
  }

  /** Saves (creates or updates) an item. Resolves to the saved record, or null if it failed. */
  const save = useCallback(
    async (item: T): Promise<T | null> => {
      if (!ops.save) throw new Error("This list can't be saved.");
      let previous: T | undefined;
      const stamped = "updatedAt" in item ? { ...item, updatedAt: new Date().toISOString() } : item;
      setItems((list) => {
        previous = list.find((i) => i.id === item.id);
        return previous ? list.map((i) => (i.id === item.id ? stamped : i)) : [stamped, ...list];
      });

      const result = await runAction(() => ops.save!(item));
      if (!result.ok) {
        setItems((list) => (previous ? list.map((i) => (i.id === item.id ? previous! : i)) : list.filter((i) => i.id !== item.id)));
        return null;
      }
      // New items come back with their database id.
      setItems((list) => list.map((i) => (i.id === item.id ? result.record : i)));
      return result.record;
    },
    [ops.save],
  );

  /** Deletes an item. Resolves to true if it worked. */
  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      if (!ops.remove) throw new Error("This list can't be deleted from.");
      let removed: { item: T; index: number } | undefined;
      setItems((list) => {
        const index = list.findIndex((i) => i.id === id);
        if (index >= 0) removed = { item: list[index], index };
        return list.filter((i) => i.id !== id);
      });
      const result = await runAction(() => ops.remove!(id));
      if (!result.ok && removed) {
        const { item, index } = removed;
        setItems((list) => [...list.slice(0, index), item, ...list.slice(index)]);
      }
      return result.ok;
    },
    [ops.remove],
  );

  return { items, save, remove };
}
