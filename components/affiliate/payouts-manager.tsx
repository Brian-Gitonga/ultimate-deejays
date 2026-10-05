"use client";

import { useId, useState, type ComponentType, type SVGProps } from "react";
import { nextPayoutDate, type AffiliateAccount, type PayoutMethod } from "@/lib/affiliate-links";
import type { AffiliatePayout } from "@/lib/affiliate-portal";
import { CheckIcon, ClockIcon, CreditCardIcon, GlobeIcon, ShieldIcon, WalletIcon } from "../icons";
import { useToast } from "../studio/manage-table";
import { StatusBadge } from "../studio/status";
import { Field, Input, Panel, Select, primaryButton, secondaryButton } from "../studio/ui";
import { useAffiliateAccount, useDraft } from "./use-account";
import { useMoney } from "../money-context";

const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const methods: { key: PayoutMethod; label: string; hint: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { key: "paypal", label: "PayPal", hint: "Arrives within a day · no fee from us", icon: WalletIcon },
  { key: "mpesa", label: "M-Pesa", hint: "Kenya, Tanzania, Ghana · arrives in minutes", icon: CreditCardIcon },
  { key: "bank", label: "Bank transfer", hint: "Any country · 2–5 business days", icon: GlobeIcon },
];

const countries = ["Ghana", "Kenya", "Nigeria", "South Africa", "Uganda", "Tanzania", "United Kingdom", "United States", "Canada", "Germany", "Other"];

export function describeMethod(a: AffiliateAccount) {
  if (a.payoutMethod === "paypal") return `PayPal · ${a.paypalEmail}`;
  if (a.payoutMethod === "mpesa") return `M-Pesa · ${a.mpesaPhone}`;
  return `${a.bank.bankName || "Bank"} •••• ${a.bank.account.slice(-4)}`;
}

export function PayoutsManager({
  initial,
  payouts,
  balance,
  minPayout,
  today,
}: {
  initial: AffiliateAccount;
  payouts: AffiliatePayout[];
  balance: { pending: number; approved: number; paidOut: number; lifetime: number };
  minPayout: number;
  today: string;
}) {
  const { exact: money } = useMoney();
  const id = useId();
  const { account, save } = useAffiliateAccount(initial);
  const method = useDraft({ payoutMethod: account.payoutMethod, paypalEmail: account.paypalEmail, mpesaPhone: account.mpesaPhone, bank: account.bank });
  const tax = useDraft(account.tax);
  const [showErrors, setShowErrors] = useState(false);
  const { show, toast } = useToast();

  const m = method.draft;
  const errors: Record<string, string> = {};
  if (m.payoutMethod === "paypal" && !emailOk(m.paypalEmail)) errors.paypal = "Enter the email of your PayPal account";
  if (m.payoutMethod === "mpesa" && !/^\+?\d[\d\s]{8,14}$/.test(m.mpesaPhone.trim())) errors.mpesa = "Enter the phone number with country code, e.g. +254 712 345 678";
  if (m.payoutMethod === "bank") {
    if (!m.bank.holder.trim()) errors.holder = "Enter the account holder's name";
    if (!m.bank.bankName.trim()) errors.bankName = "Enter your bank's name";
    if (m.bank.account.replace(/\s/g, "").length < 6) errors.account = "Enter your account number or IBAN";
  }
  const err = (k: string) => (showErrors ? errors[k] : undefined);

  const payoutDay = nextPayoutDate(today);
  const willPay = balance.approved >= minPayout;

  function saveMethod() {
    if (Object.keys(errors).length) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    save({ ...account, ...m }).then((saved) => saved && show("Payout method saved"));
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckIcon className="size-4 text-brand" /> Cleared
          </p>
          <p className="mt-2 text-[1.75rem] leading-none font-bold tracking-tight text-foreground tabular-nums">{money(balance.approved)}</p>
          <p className="mt-2 text-xs text-muted-foreground">Ready for your next payout</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ClockIcon className="size-4 text-[#c98200] dark:text-[#ffb938]" /> Pending
          </p>
          <p className="mt-2 text-[1.75rem] leading-none font-bold tracking-tight text-foreground tabular-nums">{money(balance.pending)}</p>
          <p className="mt-2 text-xs text-muted-foreground">Clears once the refund window ends</p>
        </div>
        <div className="rounded-2xl bg-brand-deep p-5 text-white">
          <p className="text-sm text-white/75">Next payout · {longDate.format(new Date(payoutDay))}</p>
          <p className="mt-2 text-[1.75rem] leading-none font-bold tracking-tight tabular-nums">{willPay ? money(balance.approved) : money(0)}</p>
          <p className="mt-2 text-xs text-white/75">
            {willPay ? `Sent to ${describeMethod(account)}` : `Cleared balance is under the ${money(minPayout)} minimum, so it rolls over to next month.`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <Panel title="How you get paid" description={`Currently: ${describeMethod(account)}`}>
          <fieldset>
            <legend className="sr-only">Payout method</legend>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {methods.map((x) => {
                const on = m.payoutMethod === x.key;
                return (
                  <label
                    key={x.key}
                    className={`relative flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${on ? "border-brand bg-brand/[0.05] ring-1 ring-brand" : "border-border hover:border-foreground/25"}`}
                  >
                    <input type="radio" name={`${id}-method`} value={x.key} checked={on} onChange={() => method.setDraft({ ...m, payoutMethod: x.key })} className="sr-only" />
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${on ? "bg-brand text-white" : "bg-foreground/[0.06] text-foreground/70"}`}>
                      <x.icon className="size-[1.125rem]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-foreground">{x.label}</span>
                      <span className="block text-xs text-muted-foreground">{x.hint}</span>
                    </span>
                    {on && <CheckIcon className="absolute top-3 right-3 size-4 text-brand" strokeWidth={3} />}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {m.payoutMethod === "paypal" && (
              <Field label="PayPal email" htmlFor={`${id}-paypal`} required error={err("paypal")}>
                <Input id={`${id}-paypal`} type="email" value={m.paypalEmail} onChange={(e) => method.setDraft({ ...m, paypalEmail: e.target.value })} aria-invalid={!!err("paypal")} />
              </Field>
            )}
            {m.payoutMethod === "mpesa" && (
              <Field label="M-Pesa phone number" htmlFor={`${id}-mpesa`} required error={err("mpesa")} hint="The number registered with M-Pesa.">
                <Input id={`${id}-mpesa`} type="tel" placeholder="+254 712 345 678" value={m.mpesaPhone} onChange={(e) => method.setDraft({ ...m, mpesaPhone: e.target.value })} aria-invalid={!!err("mpesa")} />
              </Field>
            )}
            {m.payoutMethod === "bank" && (
              <>
                <Field label="Account holder" htmlFor={`${id}-holder`} required error={err("holder")}>
                  <Input id={`${id}-holder`} value={m.bank.holder} onChange={(e) => method.setDraft({ ...m, bank: { ...m.bank, holder: e.target.value } })} aria-invalid={!!err("holder")} />
                </Field>
                <Field label="Bank name" htmlFor={`${id}-bank`} required error={err("bankName")}>
                  <Input id={`${id}-bank`} value={m.bank.bankName} onChange={(e) => method.setDraft({ ...m, bank: { ...m.bank, bankName: e.target.value } })} aria-invalid={!!err("bankName")} />
                </Field>
                <Field label="Account number or IBAN" htmlFor={`${id}-account`} required error={err("account")}>
                  <Input id={`${id}-account`} inputMode="text" autoComplete="off" value={m.bank.account} onChange={(e) => method.setDraft({ ...m, bank: { ...m.bank, account: e.target.value } })} aria-invalid={!!err("account")} />
                </Field>
                <Field label="SWIFT / BIC" htmlFor={`${id}-swift`} hint="Needed for transfers outside your country.">
                  <Input id={`${id}-swift`} value={m.bank.swift} onChange={(e) => method.setDraft({ ...m, bank: { ...m.bank, swift: e.target.value.toUpperCase() } })} />
                </Field>
              </>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldIcon className="size-4 shrink-0" /> Payment details are encrypted and only used to pay you.
            </p>
            <div className="flex gap-2">
              {method.dirty && (
                <button type="button" onClick={() => { method.reset(); setShowErrors(false); }} className={secondaryButton}>
                  Cancel
                </button>
              )}
              <button type="button" onClick={saveMethod} disabled={!method.dirty} className={primaryButton}>
                Save payout method
              </button>
            </div>
          </div>
        </Panel>

        <Panel title="Tax details" description="We need these once to send payouts. They appear on your yearly statement.">
          <div className="space-y-5">
            <Field label="Legal name" htmlFor={`${id}-legal`}>
              <Input id={`${id}-legal`} value={tax.draft.legalName} onChange={(e) => tax.setDraft({ ...tax.draft, legalName: e.target.value })} />
            </Field>
            <Field label="Country of residence" htmlFor={`${id}-country`}>
              <Select id={`${id}-country`} value={tax.draft.country} onChange={(e) => tax.setDraft({ ...tax.draft, country: e.target.value })}>
                {countries.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Tax ID" htmlFor={`${id}-taxid`} hint="Optional. e.g. KRA PIN, TIN or VAT number.">
              <Input id={`${id}-taxid`} value={tax.draft.taxId} onChange={(e) => tax.setDraft({ ...tax.draft, taxId: e.target.value })} />
            </Field>
            <button
              type="button"
              disabled={!tax.dirty}
              onClick={() => {
                save({ ...account, tax: tax.draft }).then((saved) => saved && show("Tax details saved"));
              }}
              className={`${secondaryButton} w-full`}
            >
              Save tax details
            </button>
          </div>
        </Panel>
      </div>

      <Panel title="Payout history" description={`${money(balance.paidOut)} paid to you so far. Payouts go out on the last day of each month.`}>
        {payouts.length ? (
          <div className="relative -mx-5 -my-5 overflow-x-auto sm:-mx-6 sm:-my-6">
            <table className="w-full min-w-[38rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium sm:px-6">Payout</th>
                  <th className="px-3 py-3 font-medium">For sales in</th>
                  <th className="px-3 py-3 font-medium">Sent to</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium sm:px-6">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3.5 font-mono text-xs text-foreground sm:px-6">{p.id}</td>
                    <td className="px-3 py-3.5 text-muted-foreground">
                      {p.period} · {p.referrals} {p.referrals === 1 ? "sale" : "sales"}
                    </td>
                    <td className="px-3 py-3.5 text-muted-foreground">{p.method}</td>
                    <td className="px-3 py-3.5 whitespace-nowrap text-muted-foreground">{date.format(new Date(p.date))}</td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status="published" label="Paid" />
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-foreground tabular-nums sm:px-6">{money(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Your first payout will show here.</p>
        )}
      </Panel>
      {toast}
    </>
  );
}
