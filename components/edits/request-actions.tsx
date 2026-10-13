"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cancelEditRequest, markEditSeen, replyToEditRequest } from "@/app/(site)/account/edits/actions";
import { inputClass } from "../auth-form-parts";

/* Answer the team's question (or add detail). Answering puts the request back in their queue. */
export function ReplyForm({ requestId, question }: { requestId: string; question: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await replyToEditRequest(requestId, body).catch(() => ({ ok: false, error: "We couldn't reach the server. Try again." }));
    setBusy(false);
    if (!result.ok) return setError(result.error ?? "That didn't send.");
    setBody("");
    router.refresh();
  }

  return (
    <form onSubmit={send} className="mt-4">
      <label htmlFor="edit-reply" className="mb-2 block text-sm font-medium text-foreground">
        {question ? "Your answer" : "Add a message"}
      </label>
      <textarea id="edit-reply" rows={3} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} className={`${inputClass(!!error)} h-auto py-3`} />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
        <button
          type="submit"
          disabled={busy || !body.trim()}
          className="inline-flex h-10 shrink-0 items-center rounded-lg bg-[#18181b] px-4 text-sm font-semibold text-white hover:bg-[#27272a] disabled:opacity-50 dark:bg-foreground dark:text-background"
        >
          {busy ? "Sending…" : "Send"}
        </button>
      </div>
    </form>
  );
}

/* Cancelling gives the edit back to the member's allowance. */
export function CancelRequestButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function cancel() {
    setBusy(true);
    const result = await cancelEditRequest(requestId).catch(() => ({ ok: false, error: "We couldn't reach the server. Try again." }));
    setBusy(false);
    if (!result.ok) return setError(result.error ?? "That didn't work.");
    setConfirming(false);
    router.refresh();
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-red-600 hover:underline">
        Cancel this request
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="text-foreground">Cancel it? You get the edit back.</span>
      <button type="button" disabled={busy} onClick={cancel} className="font-semibold text-red-600 hover:underline dark:text-red-400">
        {busy ? "Cancelling…" : "Yes, cancel"}
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="font-medium text-muted-foreground hover:text-foreground">
        Keep it
      </button>
      {error && <span className="w-full text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}

/* Opening a delivered edit clears its "ready" badge. */
export function MarkSeen({ requestId }: { requestId: string }) {
  useEffect(() => {
    markEditSeen(requestId).catch(() => {});
  }, [requestId]);
  return null;
}
