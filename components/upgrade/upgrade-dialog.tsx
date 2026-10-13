"use client";

import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { PlanSlug } from "@/lib/allowances";
import type { UpgradeContext, UpgradeReason } from "@/lib/upgrade";
import { CloseIcon } from "../icons";
import { useModal } from "../use-modal";
import { UpgradeMessage } from "./upgrade-message";

const noContext: UpgradeContext = { plans: [], currency: "USD", upgradeCredit: false };

/*
 * The friendly "not on your plan (yet)" prompt: what happened, in plain
 * words, and the plans that would let them do it. Opened when someone taps a
 * button their plan doesn't cover, instead of a refusal message.
 */
export function UpgradeDialog({
  reason,
  current,
  context = noContext,
  onClose,
  footer,
}: {
  reason: UpgradeReason;
  current: PlanSlug;
  context?: UpgradeContext;
  onClose: () => void;
  /** Extra footer content, e.g. "Download it again" */
  footer?: ReactNode;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inBrowser = useModal(panelRef, onClose, () => closeRef.current);

  if (!inBrowser) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-neutral-950/50 motion-safe:animate-fade-in" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-background p-6 motion-safe:animate-dialog-in dark:bg-card shadow-[0_30px_80px_-20px_rgb(0_0_0/0.45)] sm:p-7 dark:border dark:border-white/10"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <CloseIcon className="size-5" />
        </button>
        <UpgradeMessage reason={reason} current={current} context={context} titleId={titleId} />
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
          {footer}
          <button type="button" onClick={onClose} className="font-medium text-muted-foreground hover:text-foreground">
            Maybe later
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
