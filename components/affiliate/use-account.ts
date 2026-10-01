"use client";

import { useState } from "react";
import type { AffiliateAccount } from "@/lib/affiliate-links";
import { useCollection } from "@/lib/studio-store";

/** The affiliate's saved account (payout method, profile, notifications), stored in this browser until there's a backend. */
export function useAffiliateAccount(seed: AffiliateAccount[]) {
  const { items, save } = useCollection("affiliate-account", seed);
  return { account: items[0] ?? seed[0], save };
}

/**
 * Local edits of one part of a saved record. Follows the saved value when it
 * changes (first load from storage, or after a save) and reports unsaved edits.
 */
export function useDraft<T>(saved: T) {
  const json = JSON.stringify(saved);
  const [seen, setSeen] = useState(json);
  const [draft, setDraft] = useState(saved);
  if (seen !== json) {
    setSeen(json);
    setDraft(saved);
  }
  return { draft, setDraft, dirty: JSON.stringify(draft) !== json, reset: () => setDraft(saved) };
}
