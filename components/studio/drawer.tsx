"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "../icons";

/*
 * Right-hand side sheet: full height on every screen, scrollable body,
 * pinned footer. Escape or the backdrop closes it; focus returns to the opener.
 */
export function Drawer({ titleId, header, footer, onClose, children }: { titleId: string; header: ReactNode; footer?: ReactNode; onClose: () => void; children: ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      opener?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-dvh">
      <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <aside role="dialog" aria-modal="true" aria-labelledby={titleId} data-lenis-prevent className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-background shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="min-w-0 flex-1">{header}</div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-foreground/5">
            <CloseIcon className="size-5" />
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain p-5">{children}</div>
        {footer && <div className="border-t border-border p-5">{footer}</div>}
      </aside>
    </div>
  );
}
