"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
 * The student's profile, saved in this browser until accounts exist. Swap
 * read/write for your API later and keep the hook's shape.
 */

export type Profile = {
  fullName: string;
  djName: string;
  email: string;
  location: string;
  bio: string;
  experience: "new" | "bedroom" | "gigging" | "pro";
  genres: string[];
  instagram: string;
  soundcloud: string;
  /** A data URL from the photo picker, or a default image path */
  avatar: string;
};

export const defaultProfile: Profile = {
  fullName: "Jordan Blake",
  djName: "DJ Jordan",
  email: "jordan.blake@example.com",
  location: "Los Angeles, CA",
  bio: "Bedroom DJ working toward my first club set. Currently obsessed with long house blends and learning to scratch.",
  experience: "bedroom",
  genres: ["House", "Afrobeats"],
  instagram: "",
  soundcloud: "",
  avatar: "/images/students/student-3.jpg",
};

export const genreOptions = ["House", "Techno", "Amapiano", "Afrobeats", "Hip-Hop", "R&B", "Drum & Bass", "Open Format", "Disco", "Reggaeton"];

export const experienceOptions: { value: Profile["experience"]; label: string; hint: string }[] = [
  { value: "new", label: "Brand new", hint: "Never touched the decks" },
  { value: "bedroom", label: "Bedroom DJ", hint: "Practicing at home" },
  { value: "gigging", label: "Gigging", hint: "Playing parties & bars" },
  { value: "pro", label: "Working pro", hint: "Regular paid bookings" },
];

const KEY = "ud:profile";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

const readRaw = () => {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
};

function parse(raw: string): Profile {
  if (!raw) return defaultProfile;
  try {
    return { ...defaultProfile, ...JSON.parse(raw) };
  } catch {
    return defaultProfile;
  }
}

/** Returns the saved profile (or the default) and a function that saves a new one. */
export function useProfile() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const save = useCallback((profile: Profile) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(profile));
    } catch {
      throw new Error("Couldn't save: your browser storage is full or blocked.");
    }
    listeners.forEach((l) => l());
  }, []);
  return [parse(raw), save] as const;
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
