"use client";

import { useActionState } from "react";
import { startCheckout, type CheckoutState } from "@/app/(site)/checkout/actions";
import { ArrowRightIcon, ShieldIcon } from "./icons";

/** The Pay button. The server prices the order again before sending the buyer to Paystack. */
export function CheckoutPayForm({ plan, code, total, label, disabled }: { plan: string; code: string; total: number; label: string; disabled?: boolean }) {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(startCheckout, { error: null });

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="total" value={total} />
      {state.error && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || disabled}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[0.9375rem] font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            {total > 0 ? "Opening secure payment…" : "Unlocking your plan…"}
          </>
        ) : (
          <>
            {label}
            <ArrowRightIcon className="size-4" />
          </>
        )}
      </button>
      {total > 0 && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldIcon className="size-3.5" />
          Secure payment by Paystack: card, mobile money or bank.
        </p>
      )}
    </form>
  );
}
