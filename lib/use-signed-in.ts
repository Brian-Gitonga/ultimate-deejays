"use client";

import { useSyncExternalStore } from "react";
import { isSupabaseConfigured } from "./env";
import { createClient } from "./supabase/client";

/*
 * Whether someone is signed in, read in the browser so the public pages stay
 * static (reading cookies on the server would make every page dynamic).
 * For showing the right header buttons only: real access checks happen on the
 * server (proxy.ts, lib/dal.ts) and in the database.
 */

let signedIn = false;
let started = false;
const listeners = new Set<() => void>();

function start() {
  if (started || !isSupabaseConfigured()) return;
  started = true;
  // Fires once straight away with the current session, then on every sign-in/out.
  createClient().auth.onAuthStateChange((_event, session) => {
    signedIn = Boolean(session);
    listeners.forEach((listener) => listener());
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => listeners.delete(listener);
}

/** False on the server and until the browser has checked; then true/false. */
export function useSignedIn() {
  return useSyncExternalStore(subscribe, () => signedIn, () => false);
}
