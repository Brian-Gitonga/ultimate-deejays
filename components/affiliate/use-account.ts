"use client";

import { useMemo, useState } from "react";
import { saveAffiliateAccount } from "@/app/(affiliate)/affiliate/actions";
import type { AffiliateAccount } from "@/lib/affiliate-links";
import { useServerCollection } from "@/lib/studio-store";

/**
 * The affiliate's account (payout method, tax details, notifications, code
 * request), saved to the database. Changes show straight away and roll back
 * if the server refuses them. save() resolves to the saved account, or null.
 */
export function useAffiliateAccount(initial: AffiliateAccount) {
  const seed = useMemo(() => [initial], [initial]);
  const { items, save } = useServerCollection(seed, { save: saveAffiliateAccount });
  return { account: items[0] ?? initial, save };
}

/**
 * Local edits of one part of a saved record. Follows the saved value when it
 * changes (after a save) and reports unsaved edits.
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
