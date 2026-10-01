"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon } from "../icons";

/* Copies text to the clipboard and confirms in place for two seconds. */
export function CopyButton({ text, label = "Copy", className = "", iconOnly = false }: { text: string; label?: string; className?: string; iconOnly?: boolean }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(t);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  const shown = state === "copied" ? "Copied" : state === "failed" ? "Press Ctrl+C" : label;
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={iconOnly ? `${label}: ${text}` : undefined}
      className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground shadow-xs transition hover:bg-muted ${className}`}
    >
      {state === "copied" ? <CheckIcon className="size-4 text-brand" /> : <CopyIcon className="size-4" />}
      {!iconOnly && <span>{shown}</span>}
      <span aria-live="polite" className="sr-only">
        {state === "copied" ? "Copied to clipboard" : ""}
      </span>
    </button>
  );
}
