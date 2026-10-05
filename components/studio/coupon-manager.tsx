"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { deleteCoupon, saveCoupon } from "@/app/(studio)/studio/coupons/actions";
import { discountOf, formatMoney } from "@/lib/checkout";
import { couponState, couponStateLabel, type Coupon, type CouponPlan, type CouponState } from "@/lib/coupons";
import { siteUrl } from "@/lib/site";
import { uid } from "@/lib/studio-courses";
import { useServerCollection } from "@/lib/studio-store";
import { CopyButton } from "../affiliate/copy-button";
import { CheckIcon, ClockIcon, CloseIcon, PauseIcon, PencilIcon, PercentIcon, PlusIcon, TagIcon, TrashIcon, TrendUpIcon, WalletIcon } from "../icons";
import { Drawer } from "./drawer";
import { ConfirmDialog, ManageTable, RowMenu, useToast } from "./manage-table";
import { statusMeta } from "./status";
import { Field, Input, Kpi, Select, Switch, primaryButton } from "./ui";

type PlanPrices = Record<CouponPlan, { name: string; price: number }>;

const stateStyle: Record<CouponState, { pill: string; icon: typeof CheckIcon }> = {
  live: { pill: statusMeta.published.pill, icon: CheckIcon },
  scheduled: { pill: statusMeta.review.pill, icon: ClockIcon },
  expired: { pill: statusMeta.draft.pill, icon: CloseIcon },
  "used-up": { pill: statusMeta.draft.pill, icon: CheckIcon },
  off: { pill: statusMeta.draft.pill, icon: PauseIcon },
};

function StateBadge({ state }: { state: CouponState }) {
  const s = stateStyle[state];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${s.pill}`}>
      <s.icon className="size-3" strokeWidth={2.5} />
      {couponStateLabel[state]}
    </span>
  );
}

const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

const blank = (): Coupon => ({
  id: uid(),
  code: "",
  description: "",
  discountType: "percent",
  discountValue: 20,
  plans: [],
  maxRedemptions: null,
  redemptions: 0,
  oncePerCustomer: true,
  startsOn: null,
  endsOn: null,
  active: true,
  revenue: 0,
  discounted: 0,
  updatedAt: new Date().toISOString(),
});

/*
 * Studio → Coupons: promo codes buyers type at checkout (or arrive with, via
 * /checkout?plan=…&code=…). Affiliate codes are separate: each affiliate's
 * code gives the discount set in Studio → Affiliates.
 */
export function CouponManager({
  seed,
  today,
  currency,
  plans,
  affiliateDiscount,
}: {
  seed: Coupon[];
  today: string;
  currency: string;
  plans: PlanPrices;
  affiliateDiscount: number;
}) {
  const { items, save, remove } = useServerCollection(seed, { save: saveCoupon, remove: deleteCoupon });
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const { show, toast } = useToast();
  const money = (n: number) => formatMoney(n, currency);
  const off = (c: Coupon) => (c.discountType === "percent" ? `${c.discountValue}% off` : `${money(c.discountValue)} off`);
  const planList = (c: Coupon) => (c.plans.length ? c.plans.map((p) => plans[p].name).join(", ") : "All paid plans");

  const live = items.filter((c) => couponState(c, today) === "live").length;
  const orders = items.reduce((s, c) => s + c.redemptions, 0);
  const revenue = items.reduce((s, c) => s + c.revenue, 0);
  const given = items.reduce((s, c) => s + c.discounted, 0);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon={TagIcon} label="Live codes" value={String(live)} note={`${items.length} in total`} />
        <Kpi icon={CheckIcon} label="Orders with a code" value={String(orders)} note="Promo codes only" />
        <Kpi icon={WalletIcon} label="Revenue from codes" value={money(revenue)} note="What buyers paid" />
        <Kpi icon={PercentIcon} label="Discount given" value={money(given)} note={`Affiliate codes give ${affiliateDiscount}% by default`} />
      </ul>

      <ManageTable
        title="Coupons"
        items={items}
        getId={(c) => c.id}
        minWidth="56rem"
        searchText={(c) => [c.code, c.description]}
        searchPlaceholder="Search codes"
        onRowClick={(c) => setEditing(c)}
        tabs={[
          { key: "all", label: "All", test: () => true },
          { key: "live", label: "Live", test: (c: Coupon) => couponState(c, today) === "live" },
          { key: "ended", label: "Ended or off", test: (c: Coupon) => ["expired", "used-up", "off"].includes(couponState(c, today)) },
        ]}
        toolbar={
          <button type="button" onClick={() => setEditing(blank())} className={`${primaryButton} h-10`}>
            <PlusIcon className="size-4" /> New coupon
          </button>
        }
        columns={[
          {
            key: "code",
            header: "Code",
            sort: (c) => c.code,
            render: (c) => (
              <span className="block min-w-0">
                <span className="block font-mono font-semibold text-foreground">{c.code}</span>
                <span className="block max-w-[16rem] truncate text-xs text-muted-foreground">{c.description || planList(c)}</span>
              </span>
            ),
          },
          { key: "discount", header: "Discount", sort: (c) => c.discountValue, render: (c) => <span className="whitespace-nowrap text-foreground">{off(c)}</span> },
          { key: "plans", header: "Plans", sort: (c) => planList(c), render: (c) => <span className="text-muted-foreground">{planList(c)}</span> },
          {
            key: "used",
            header: "Used",
            align: "right",
            sort: (c) => c.redemptions,
            render: (c) => (
              <span className="tabular-nums">
                {c.redemptions}
                {c.maxRedemptions !== null && <span className="text-muted-foreground"> / {c.maxRedemptions}</span>}
              </span>
            ),
          },
          { key: "revenue", header: "Revenue", align: "right", sort: (c) => c.revenue, render: (c) => <span className="tabular-nums">{money(c.revenue)}</span> },
          {
            key: "dates",
            header: "Runs",
            sort: (c) => c.endsOn ?? "9999",
            render: (c) => (
              <span className="whitespace-nowrap text-muted-foreground">
                {c.startsOn ? date.format(new Date(c.startsOn)) : "Now"} – {c.endsOn ? date.format(new Date(c.endsOn)) : "No end"}
              </span>
            ),
          },
          { key: "state", header: "Status", sort: (c) => couponState(c, today), render: (c) => <StateBadge state={couponState(c, today)} /> },
        ]}
        actions={(c) => (
          <RowMenu
            label={`Actions for ${c.code}`}
            items={[
              { label: "Edit", icon: PencilIcon, onSelect: () => setEditing(c) },
              {
                label: c.active ? "Switch off" : "Switch on",
                icon: c.active ? PauseIcon : CheckIcon,
                onSelect: () => save({ ...c, active: !c.active }).then((saved) => saved && show(`${c.code} ${saved.active ? "switched on" : "switched off"}`)),
              },
              { label: "Delete", icon: TrashIcon, danger: true, onSelect: () => setDeleting(c) },
            ]}
          />
        )}
        empty={
          <p className="text-muted-foreground">
            No coupons yet. Make one for a launch, a holiday sale or a partner. Affiliates already have their own codes in{" "}
            <Link href="/studio/affiliates" className="font-medium text-brand hover:underline">
              Affiliates
            </Link>
            .
          </p>
        }
      />

      {editing && (
        <CouponDrawer
          key={editing.id}
          coupon={editing}
          plans={plans}
          money={money}
          taken={items.filter((c) => c.id !== editing.id).map((c) => c.code)}
          onClose={() => setEditing(null)}
          onSave={async (next) => {
            const saved = await save(next);
            if (saved) {
              setEditing(null);
              show(`${saved.code} saved`);
            }
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.code}?`}
          body={
            deleting.redemptions
              ? `It's been used ${deleting.redemptions} ${deleting.redemptions === 1 ? "time" : "times"}. Those orders keep their discount; the code just stops working. Switching it off keeps its history in this list.`
              : "The code stops working straight away."
          }
          confirmLabel="Delete coupon"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            const c = deleting;
            setDeleting(null);
            remove(c.id).then((ok) => ok && show(`${c.code} deleted`));
          }}
        />
      )}
      {toast}
    </>
  );
}

function CouponDrawer({
  coupon,
  plans,
  money,
  taken,
  onClose,
  onSave,
}: {
  coupon: Coupon;
  plans: PlanPrices;
  money: (n: number) => string;
  taken: string[];
  onClose: () => void;
  onSave: (next: Coupon) => Promise<void>;
}) {
  const titleId = useId();
  const isNew = !coupon.code;
  const [draft, setDraft] = useState(coupon);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof Coupon>(key: K, value: Coupon[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const code = draft.code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const codeTaken = taken.includes(code);
  const shareLink = `${siteUrl}/checkout?plan=${draft.plans[0] ?? "resident"}&code=${code}`;

  async function submit() {
    if (!/^[A-Z0-9]{3,20}$/.test(code)) return setError("Use 3–20 letters or numbers for the code.");
    if (codeTaken) return setError("Another coupon already uses that code.");
    if (!(draft.discountValue > 0)) return setError("Enter a discount above 0.");
    if (draft.discountType === "percent" && draft.discountValue > 100) return setError("A percentage can't be over 100%.");
    if (draft.startsOn && draft.endsOn && draft.endsOn < draft.startsOn) return setError("The end date must be after the start date.");
    setError("");
    setBusy(true);
    await onSave({ ...draft, code });
    setBusy(false);
  }

  const togglePlan = (plan: CouponPlan) => set("plans", draft.plans.includes(plan) ? draft.plans.filter((p) => p !== plan) : [...draft.plans, plan]);
  const appliesTo = (Object.keys(plans) as CouponPlan[]).filter((p) => !draft.plans.length || draft.plans.includes(p));

  return (
    <Drawer
      titleId={titleId}
      onClose={onClose}
      header={
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          {isNew ? "New coupon" : `Edit ${coupon.code}`}
        </h2>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : <span />}
          <button type="button" disabled={busy} onClick={submit} className={primaryButton}>
            {busy ? "Saving…" : "Save coupon"}
          </button>
        </div>
      }
    >
      <Field label="Code" htmlFor="coupon-code" required error={codeTaken ? "Another coupon already uses that code." : undefined} hint="What buyers type at checkout. Letters and numbers only.">
        <Input
          id="coupon-code"
          value={draft.code}
          maxLength={20}
          onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
          placeholder="e.g. LAUNCH20"
          className="font-mono uppercase placeholder:font-sans placeholder:normal-case"
        />
      </Field>
      <Field label="Note" htmlFor="coupon-note" hint="Private, for your team: what it's for.">
        <Input id="coupon-note" value={draft.description} maxLength={200} onChange={(e) => set("description", e.target.value)} placeholder="e.g. Black Friday newsletter" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Discount type" htmlFor="coupon-type">
          <Select id="coupon-type" value={draft.discountType} onChange={(e) => set("discountType", e.target.value as Coupon["discountType"])}>
            <option value="percent">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </Select>
        </Field>
        <Field label={draft.discountType === "percent" ? "Percent off" : "Amount off"} htmlFor="coupon-value" required>
          <Input id="coupon-value" type="number" min={0} max={draft.discountType === "percent" ? 100 : undefined} step="0.01" value={draft.discountValue || ""} onChange={(e) => set("discountValue", Number(e.target.value))} />
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-foreground">Works on</legend>
        <p className="mt-0.5 text-xs text-muted-foreground">Tick none for every paid plan.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(plans) as CouponPlan[]).map((p) => {
            const on = draft.plans.includes(p);
            return (
              <button
                key={p}
                type="button"
                aria-pressed={on}
                onClick={() => togglePlan(p)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${on ? "bg-foreground text-background" : "bg-foreground/[0.06] text-foreground hover:bg-foreground/10"}`}
              >
                {on && <CheckIcon className="size-3.5" />}
                {plans[p].name}
              </button>
            );
          })}
        </div>
      </fieldset>

      {draft.discountValue > 0 && (
        <ul className="space-y-1 rounded-xl bg-brand/[0.07] px-4 py-3 text-sm text-foreground">
          {appliesTo.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <TrendUpIcon className="size-3.5 -scale-y-100 text-brand" />
              {plans[p].name}: <span className="text-muted-foreground line-through">{money(plans[p].price)}</span>
              <span className="font-semibold">{money(plans[p].price - discountOf(plans[p].price, draft.discountType, draft.discountValue))}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Starts" htmlFor="coupon-start" hint="Empty = now">
          <Input id="coupon-start" type="date" value={draft.startsOn ?? ""} onChange={(e) => set("startsOn", e.target.value || null)} />
        </Field>
        <Field label="Ends (last day)" htmlFor="coupon-end" hint="Empty = no end">
          <Input id="coupon-end" type="date" value={draft.endsOn ?? ""} onChange={(e) => set("endsOn", e.target.value || null)} />
        </Field>
      </div>
      <Field label="Total uses" htmlFor="coupon-max" hint={`Empty = unlimited. Used ${draft.redemptions} ${draft.redemptions === 1 ? "time" : "times"} so far.`}>
        <Input
          id="coupon-max"
          type="number"
          min={1}
          value={draft.maxRedemptions ?? ""}
          onChange={(e) => set("maxRedemptions", e.target.value ? Math.max(1, Math.round(Number(e.target.value))) : null)}
          placeholder="Unlimited"
        />
      </Field>
      <Switch id="coupon-once" label="Once per student" hint="Each account can use it once." checked={draft.oncePerCustomer} onChange={(on) => set("oncePerCustomer", on)} />
      <Switch id="coupon-active" label="Switched on" hint="Off: the code stops working, but keeps its history." checked={draft.active} onChange={(on) => set("active", on)} />

      {code.length >= 3 && (
        <div>
          <p className="text-sm font-medium text-foreground">Share link</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Opens checkout with the code already applied.</p>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-1.5 pl-3">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">{shareLink.replace(/^https?:\/\//, "")}</span>
            <CopyButton text={shareLink} className="h-8" />
          </div>
        </div>
      )}
    </Drawer>
  );
}
