"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { EditField } from "@/lib/edits";
import { formatPhone, normalizePhone } from "@/lib/phone";
import { ArrowRightIcon, CheckIcon, ClockIcon, CloseIcon } from "../icons";
import { StoreCover } from "../store/store-cover";
import { useModal } from "../use-modal";
import { EditRequestFields, NextSteps, SendButton, useEditRequest, type EditTemplate } from "./request-edit-form";

/*
 * Request an edit, without leaving the template: a full-screen sheet on
 * phones, a large panel on bigger screens. The header (what's being edited)
 * and the footer (Send) stay put while the fields scroll, so a long form
 * never hides its button. Closing with answers in it asks first; sending
 * turns it into a confirmation.
 */
export function RequestEditDialog({
  template,
  form,
  turnaround,
  userId,
  phone,
  meter,
  onClose,
  onSent,
}: {
  template: EditTemplate;
  form: EditField[];
  turnaround: string;
  userId: string;
  phone: string;
  /** "3 of 8 edit requests left", or null when unlimited */
  meter: string | null;
  onClose: () => void;
  /** After it's sent, e.g. to update the edits left */
  onSent?: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLAnchorElement>(null);
  const state = useEditRequest({ slug: template.slug, form, userId, savedPhone: phone });
  const [confirming, setConfirming] = useState(false);
  const [sent, setSent] = useState<{ id: string; textTo: string } | null>(null);

  /** Close, unless that would lose what they've typed: then ask first. */
  const requestClose = () => {
    if (state.busy) return;
    if (confirming) return setConfirming(false);
    if (sent || !state.dirty) return onClose();
    setConfirming(true);
  };
  const discard = () => {
    state.discardUploads();
    onClose();
  };
  // With a mouse, start in the first field; on touch screens don't pop the keyboard up over the form.
  const inBrowser = useModal(panelRef, requestClose, () =>
    window.matchMedia("(pointer: fine)").matches ? (panelRef.current?.querySelector<HTMLElement>('form input:not([type="file"]):not([type="checkbox"]), form textarea, form select') ?? null) : null,
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setConfirming(false);
    const id = await state.submit();
    if (!id) return;
    const number = normalizePhone(state.phone);
    setSent({ id, textTo: number ? formatPhone(number) : "" });
    onSent?.();
    requestAnimationFrame(() => doneRef.current?.focus());
  }

  if (!inBrowser) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-stretch justify-center sm:items-center sm:p-6">
      <div aria-hidden="true" onClick={requestClose} className="absolute inset-0 bg-neutral-950/55 motion-safe:animate-fade-in" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-[100dvh] w-full flex-col bg-background shadow-[0_30px_80px_-20px_rgb(0_0_0/0.5)] motion-safe:animate-dialog-in sm:h-auto sm:max-h-[min(56rem,calc(100dvh-3rem))] sm:max-w-2xl sm:rounded-3xl dark:bg-card sm:dark:border sm:dark:border-white/10"
      >
        {/* What's being edited */}
        <header className="flex items-center gap-4 border-b border-border px-4 py-3.5 sm:px-6 sm:py-4">
          <span className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-24">
            <StoreCover resource={template} sizes="96px" compact />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-brand">{sent ? "Request sent" : "Request an edit"}</p>
            <h2 id={titleId} className="truncate font-semibold text-foreground">
              {template.title}
            </h2>
            {!sent && (turnaround || meter) && (
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {turnaround && (
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="size-3.5" /> {turnaround}
                  </span>
                )}
                {meter && <span className="font-medium text-brand-deep dark:text-brand">{meter}</span>}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="flex size-10 shrink-0 items-center justify-center self-start rounded-full text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground"
          >
            <CloseIcon className="size-5" />
          </button>
        </header>

        {sent ? (
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-8 sm:px-8">
            <div className="mx-auto max-w-md text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
                <CheckIcon className="size-7" strokeWidth={2.5} />
              </span>
              <h3 className="mt-4 text-xl font-semibold text-balance text-foreground">Your request is with our team</h3>
              <p className="mt-2 text-sm text-pretty text-muted-foreground">
                {sent.textTo ? (
                  <>
                    We&apos;ll message you at <span className="font-medium text-foreground">{sent.textTo}</span> when it&apos;s ready.
                  </>
                ) : (
                  "We'll let you know in My edits when it's ready."
                )}{" "}
                {turnaround && (/[.!?]$/.test(turnaround) ? turnaround : `${turnaround}.`)}
              </p>
            </div>
            <NextSteps className="mx-auto mt-6 max-w-md rounded-2xl bg-muted/60 p-4 text-left" />
            <div className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
              <Link
                ref={doneRef}
                href={`/account/edits/${sent.id}`}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#18181b] text-sm font-semibold text-white transition hover:bg-[#27272a] dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
              >
                See my request <ArrowRightIcon className="size-4" />
              </Link>
              <button type="button" onClick={onClose} className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-border text-sm font-semibold text-foreground transition hover:bg-foreground/5">
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7">
              <EditRequestFields state={state} />
            </div>

            <footer className="border-t border-border bg-background px-4 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:rounded-b-3xl sm:px-6 dark:bg-card">
              {confirming ? (
                <div role="alertdialog" aria-label="Discard this request?" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">Discard this request?</span> <span className="text-muted-foreground">What you&apos;ve typed and uploaded will be lost.</span>
                  </p>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" autoFocus onClick={() => setConfirming(false)} className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-foreground/5 sm:flex-none">
                      Keep editing
                    </button>
                    <button type="button" onClick={discard} className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 sm:flex-none">
                      Discard
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p aria-live="polite" className={`text-sm ${state.formError ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                    {state.formError || "We'll start as soon as it's in."}
                  </p>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={requestClose} className="hidden h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold text-muted-foreground hover:bg-foreground/5 hover:text-foreground sm:inline-flex">
                      Cancel
                    </button>
                    <SendButton state={state} className="flex-1 sm:flex-none" />
                  </div>
                </div>
              )}
            </footer>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
