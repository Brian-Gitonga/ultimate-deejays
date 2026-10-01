"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
 * Lesson progress and notes, saved in this browser's localStorage. Components
 * subscribe through useSyncExternalStore, so every part of the page stays in
 * sync (and other tabs too, via the storage event). When accounts exist, swap
 * read/write for API calls and keep the hooks' shape.
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

function read(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be full or blocked (private mode); progress just won't persist.
  }
  listeners.forEach((listener) => listener());
}

const EMPTY = "[]";

/** Completed lesson slugs for a course, plus setters. */
export function useCompletedLessons(courseSlug: string) {
  const key = `ud:progress:${courseSlug}`;
  // The snapshot is the raw string, so it stays referentially stable between reads.
  const raw = useSyncExternalStore(subscribe, () => read(key, EMPTY), () => EMPTY);

  const completed = parseList(raw);

  const setDone = useCallback(
    (lesson: string, done: boolean) => {
      const current = new Set(parseList(read(key, EMPTY)));
      if (done) current.add(lesson);
      else current.delete(lesson);
      write(key, JSON.stringify([...current]));
    },
    [key],
  );

  return { completed, setDone };
}

/** Completed lesson slugs for every course with progress, keyed by course slug. */
export function useAllProgress(): Record<string, string[]> {
  const raw = useSyncExternalStore(subscribe, readAllProgress, () => "{}");
  return JSON.parse(raw);
}

// Serialized so the snapshot is a stable string between reads.
function readAllProgress() {
  const all: Record<string, string[]> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("ud:progress:")) all[key.slice("ud:progress:".length)] = parseList(localStorage.getItem(key) ?? EMPTY);
    }
  } catch {
    // Storage blocked: no progress to show.
  }
  return JSON.stringify(all, Object.keys(all).sort());
}

function parseList(raw: string): string[] {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** A personal note for one lesson. */
export function useLessonNote(courseSlug: string, lessonSlug: string) {
  const key = `ud:notes:${courseSlug}:${lessonSlug}`;
  const note = useSyncExternalStore(subscribe, () => read(key, ""), () => "");
  const setNote = useCallback((value: string) => write(key, value), [key]);
  return [note, setNote] as const;
}
