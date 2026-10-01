"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { StudioCourse } from "./studio-courses";

/*
 * Studio collections (courses, posts, challenges, students), saved in this
 * browser until there's a backend. Each shows the server's seed list until
 * the first edit. Swap save/remove for API calls later and keep the shape.
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

const readRaw = (key: string) => {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
};

const caches = new Map<string, { raw: string; seed: unknown[]; value: unknown[] }>();

function parse<T>(key: string, raw: string, seed: T[]): T[] {
  const cached = caches.get(key);
  if (cached && cached.raw === raw && cached.seed === seed) return cached.value as T[];
  let value = seed;
  if (raw) {
    try {
      value = JSON.parse(raw);
    } catch {
      value = seed;
    }
  }
  caches.set(key, { raw, seed, value });
  return value;
}

export function useCollection<T extends { id: string; updatedAt?: string }>(name: string, seed: T[]) {
  const key = `ud:studio-${name}`;
  const raw = useSyncExternalStore(subscribe, () => readRaw(key), () => "");
  const items = parse(key, raw, seed);

  const persist = useCallback(
    (next: T[]) => {
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        throw new Error("Couldn't save: your browser storage is full. Try a smaller image.");
      }
      listeners.forEach((l) => l());
    },
    [key],
  );

  const current = useCallback(() => parse(key, readRaw(key), seed), [key, seed]);

  const save = useCallback(
    (item: T) => {
      const list = current();
      const updated = "updatedAt" in item ? { ...item, updatedAt: new Date().toISOString() } : item;
      persist(list.some((i) => i.id === item.id) ? list.map((i) => (i.id === item.id ? updated : i)) : [updated, ...list]);
      return updated;
    },
    [current, persist],
  );

  const remove = useCallback((id: string) => persist(current().filter((i) => i.id !== id)), [current, persist]);

  return { items, save, remove };
}

export function useStudioCourses(seed: StudioCourse[]) {
  const { items, save, remove } = useCollection("courses", seed);
  return { courses: items, save, remove };
}
