"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import type { AffiliateAccount } from "@/lib/affiliate-links";
import { CheckIcon, ClockIcon, TagIcon } from "../icons";
import { ConfirmDialog, useToast } from "../studio/manage-table";
import { Field, Input, Panel, Switch, Textarea, primaryButton, secondaryButton } from "../studio/ui";
import { useAffiliateAccount, useDraft } from "./use-account";


export function AffiliateSettings({
  initial,
  affiliate,
  program,
}: {
  initial: AffiliateAccount;
  affiliate: { code: string; commission: number; customerDiscount: number; avatar: string | null; approvedAt: string | null };
  program: { cookieDays: number; minPayout: number; refundWindow: number; terms: string; currency: string };
}) {
  const id = useId();
  const { account, save } = useAffiliateAccount(initial);
  const profile = useDraft({ website: account.website, channels: account.channels });
  const notify = useDraft(account.notifications);
  const [code, setCode] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const { show, toast } = useToast();

  const p = profile.draft;
  const errors = { website: p.website.trim() && !/^https?:\/\//.test(p.website.trim()) ? "Start with https://" : "" };
  const requested = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const codeError = requested && (requested.length < 4 || requested.length > 14) ? "Use 4 to 14 letters or numbers" : "";
  const initials = account.name.split(" ").map((x) => x[0]).slice(0, 2).join("");

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="min-w-0 space-y-6">
        <Panel title="Profile" description="How we contact you. Students never see these details.">
          <div className="mb-6 flex items-center gap-4">
            {affiliate.avatar ? (
              <Image src={affiliate.avatar} alt="" width={128} height={128} className="size-16 rounded-full object-cover" />
            ) : (
              <span className="flex size-16 items-center justify-center rounded-full bg-foreground/[0.08] text-lg font-semibold text-foreground/80">{initials}</span>
            )}
            <div>
              <p className="font-semibold text-foreground">{account.name}</p>
              <p className="text-sm text-muted-foreground">Affiliate since {affiliate.approvedAt ? new Date(affiliate.approvedAt).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }) : "—"}</p>
            </div>
          </div>
          <dl className="mb-5 grid grid-cols-1 gap-4 rounded-xl bg-muted/50 p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="mt-0.5 font-medium text-foreground">{account.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="mt-0.5 truncate font-medium text-foreground">{account.email}</dd>
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Change these in <Link href="/account/profile" className="font-medium text-brand hover:underline">your profile</Link> and{" "}
              <Link href="/account/settings" className="font-medium text-brand hover:underline">account settings</Link>.
            </p>
          </dl>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Main channel or website" htmlFor={`${id}-site`} error={showErrors ? errors.website || undefined : undefined}>
                <Input id={`${id}-site`} type="url" placeholder="https://" value={p.website} onChange={(e) => profile.setDraft({ ...p, website: e.target.value })} aria-invalid={showErrors && !!errors.website} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Where else you promote us" htmlFor={`${id}-channels`} hint="One per line. Helps us send you the right promo files.">
                <Textarea id={`${id}-channels`} rows={3} value={p.channels} onChange={(e) => profile.setDraft({ ...p, channels: e.target.value })} />
              </Field>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2 border-t border-border pt-5">
            {profile.dirty && (
              <button type="button" onClick={() => { profile.reset(); setShowErrors(false); }} className={secondaryButton}>
                Cancel
              </button>
            )}
            <button
              type="button"
              disabled={!profile.dirty}
              onClick={() => {
                if (errors.website) return setShowErrors(true);
                setShowErrors(false);
                save({ ...account, ...p }).then((saved) => saved && show("Profile saved"));
              }}
              className={primaryButton}
            >
              Save profile
            </button>
          </div>
        </Panel>

        <section id="code" className="scroll-mt-24">
          <Panel title="Referral code" description="Your code works at checkout and is part of your links.">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <TagIcon className="size-5" />
              </span>
              <span className="font-mono text-2xl font-bold tracking-wide text-foreground">{affiliate.code}</span>
              <span className="text-sm text-muted-foreground">Current code</span>
            </div>
            {account.codeRequest ? (
              <p role="status" className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#c98200]/30 bg-[#c98200]/[0.07] px-4 py-3 text-sm text-foreground">
                <ClockIcon className="mt-0.5 size-4 shrink-0 text-[#9a6400] dark:text-[#ffb938]" />
                <span>
                  You asked for <span className="font-mono font-semibold">{account.codeRequest}</span>. We&apos;ll review it within 2 business days. Your old code and links keep working.
                  <button
                    type="button"
                    onClick={() => {
                      save({ ...account, codeRequest: null }).then((saved) => saved && show("Request cancelled"));
                    }}
                    className="ml-1 font-medium text-brand hover:underline"
                  >
                    Cancel request
                  </button>
                </span>
              </p>
            ) : (
              <form
                className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!requested || codeError) return;
                  save({ ...account, codeRequest: requested }).then((saved) => {
                    if (!saved) return;
                    setCode("");
                    show("Code request sent");
                  });
                }}
              >
                <div className="flex-1">
                  <Field label="Request a different code" htmlFor={`${id}-code`} error={codeError || undefined} hint="Something short your audience will remember, like your DJ name.">
                    <Input id={`${id}-code`} value={code} maxLength={14} onChange={(e) => setCode(e.target.value)} placeholder="e.g. KAYAMIXES" className="font-mono uppercase placeholder:font-sans placeholder:normal-case" aria-invalid={!!codeError} />
                  </Field>
                </div>
                <button type="submit" disabled={!requested || !!codeError} className={`${secondaryButton} h-11 sm:mt-6`}>
                  Send request
                </button>
              </form>
            )}
          </Panel>
        </section>

        <Panel title="Email notifications" description={`Sent to ${account.email}`}>
          <div className="space-y-5">
            <Switch id={`${id}-n-sale`} label="Someone buys through my link" checked={notify.draft.sale} onChange={(on) => notify.setDraft({ ...notify.draft, sale: on })} />
            <Switch id={`${id}-n-cleared`} label="A commission clears" hint="When the refund window ends." checked={notify.draft.cleared} onChange={(on) => notify.setDraft({ ...notify.draft, cleared: on })} />
            <Switch id={`${id}-n-payout`} label="A payout is sent" checked={notify.draft.payout} onChange={(on) => notify.setDraft({ ...notify.draft, payout: on })} />
            <Switch id={`${id}-n-assets`} label="New promo files" hint="New banners, courses and campaigns to share." checked={notify.draft.newAssets} onChange={(on) => notify.setDraft({ ...notify.draft, newAssets: on })} />
            <Switch id={`${id}-n-monthly`} label="Monthly summary" hint="Clicks, sales and earnings on the 1st of each month." checked={notify.draft.monthly} onChange={(on) => notify.setDraft({ ...notify.draft, monthly: on })} />
          </div>
          {notify.dirty && (
            <div className="mt-6 flex justify-end gap-2 border-t border-border pt-5">
              <button type="button" onClick={notify.reset} className={secondaryButton}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  save({ ...account, notifications: notify.draft }).then((saved) => saved && show("Notification settings saved"));
                }}
                className={primaryButton}
              >
                Save
              </button>
            </div>
          )}
        </Panel>
      </div>

      <div className="space-y-6">
        <section id="program" className="scroll-mt-24">
          <Panel title="Your program terms">
            <dl className="grid grid-cols-2 gap-3">
              {[
                ["Commission", `${affiliate.commission}%`],
                ["Buyer discount", affiliate.customerDiscount ? `${affiliate.customerDiscount}% off` : "None"],
                ["Cookie", `${program.cookieDays} days`],
                ["Refund window", `${program.refundWindow} days`],
                ["Minimum payout", new Intl.NumberFormat("en-US", { style: "currency", currency: program.currency, maximumFractionDigits: 0 }).format(program.minPayout)],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col-reverse rounded-xl border border-border p-3">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="text-lg font-bold text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{program.terms}</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {["Commission is on what the buyer pays, after any discount", "Upgrades earn commission on the difference paid", "Payouts go out on the last day of each month"].map((t) => (
                <li key={t} className="flex gap-2">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
                  {t}
                </li>
              ))}
            </ul>
          </Panel>
        </section>

        <Panel title="Leave the program">
          {account.leaveRequestedAt ? (
            <p role="status" className="text-sm text-muted-foreground">
              You asked to leave on {new Date(account.leaveRequestedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" })}. We&apos;ll confirm by
              email and pay out any cleared balance.{" "}
              <button
                type="button"
                onClick={() => save({ ...account, leaveRequestedAt: null }).then((saved) => saved && show("You're staying in the program"))}
                className="font-medium text-brand hover:underline"
              >
                I&apos;ve changed my mind
              </button>
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Your links stop earning once we confirm. Cleared commission is still paid in the next payout.</p>
              <button type="button" onClick={() => setLeaving(true)} className="mt-4 inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold text-red-600 hover:bg-red-500/10 dark:text-red-400">
                Leave affiliate program
              </button>
            </>
          )}
        </Panel>
      </div>

      {leaving && (
        <ConfirmDialog
          title="Leave the affiliate program?"
          body="Your referral link and code will stop earning commission. We'll pay out any cleared balance at the end of the month."
          confirmLabel="Leave program"
          onCancel={() => setLeaving(false)}
          onConfirm={() => {
            setLeaving(false);
            save({ ...account, leaveRequestedAt: new Date().toISOString() }).then((saved) => saved && show("Request received. We'll email you to confirm."));
          }}
        />
      )}
      {toast}
    </div>
  );
}
