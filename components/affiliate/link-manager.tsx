"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { prettyUrl, referralUrl, toSub } from "@/lib/affiliate-links";
import type { TrackedLink } from "@/lib/affiliate-portal";
import { useCollection } from "@/lib/studio-store";
import { ArrowUpRightIcon, CheckIcon, LinkIcon, PlusIcon, TagIcon, TrashIcon } from "../icons";
import { ConfirmDialog, ManageTable, RowMenu, useToast } from "../studio/manage-table";
import { Field, Input, Panel, Select, primaryButton } from "../studio/ui";
import { CopyButton } from "./copy-button";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function LinkManager({
  code,
  seed,
  destinations,
  cookieDays,
  today,
}: {
  code: string;
  seed: TrackedLink[];
  destinations: { path: string; label: string }[];
  cookieDays: number;
  today: string;
}) {
  const id = useId();
  const { items, save, remove } = useCollection("affiliate-links", seed);
  const [path, setPath] = useState(destinations[0].path);
  const [label, setLabel] = useState("");
  const [deleting, setDeleting] = useState<TrackedLink | null>(null);
  const [newId] = useState(() => `lnk-${Math.random().toString(36).slice(2, 8)}`);
  const [created, setCreated] = useState(0);
  const { show, toast } = useToast();

  const sub = toSub(label);
  const url = referralUrl(code, path, sub || undefined);
  const destinationName = (p: string) => destinations.find((d) => d.path === p)?.label ?? p;
  const taken = !!sub && items.some((l) => l.sub === sub);

  function create() {
    if (!sub || taken) return;
    save({ id: `${newId}-${created}`, label: label.trim(), path, sub, createdAt: today, clicks: 0, sales: 0, earned: 0, updatedAt: new Date().toISOString() });
    setCreated((n) => n + 1);
    setLabel("");
    show("Link saved. Copy it from the list below.");
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
        <Panel title="Create a tracking link" description="Make a link for each place you post, so you can see which ones bring sales.">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Where you'll share it" htmlFor={`${id}-label`} required hint={sub ? <>Tracked as <span className="font-mono">sub={sub}</span></> : "e.g. “TikTok bio” or “Amapiano transitions video”"} error={taken ? "You already have a link with this name" : undefined}>
                <Input id={`${id}-label`} value={label} maxLength={40} onChange={(e) => setLabel(e.target.value)} placeholder="Name this link" aria-invalid={taken} />
              </Field>
              <Field label="Page it opens" htmlFor={`${id}-path`}>
                <Select id={`${id}-path`} value={path} onChange={(e) => setPath(e.target.value)}>
                  {destinations.map((d) => (
                    <option key={d.path} value={d.path}>
                      {d.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">Your link</p>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <p className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-dashed border-border bg-muted/50 px-3.5 py-2.5 font-mono text-sm text-foreground">
                  <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 break-all">{prettyUrl(url)}</span>
                </p>
                <div className="flex gap-2">
                  <CopyButton text={url} className="h-11 flex-1 sm:flex-none" />
                  <button type="submit" disabled={!sub || taken} className={`${primaryButton} h-11 flex-1 sm:flex-none`}>
                    <PlusIcon className="size-4" /> Save link
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Copy works straight away. Saving adds it to your list so you can track clicks and sales.</p>
            </div>
          </form>
        </Panel>

        <div className="space-y-6">
          <Panel title="Your referral code">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <TagIcon className="size-5" />
              </span>
              <p className="min-w-0 flex-1 font-mono text-2xl font-bold tracking-wide text-foreground">{code}</p>
              <CopyButton text={code} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Students can type this at checkout if they didn&apos;t use your link. Great for videos, podcasts and live sets.</p>
            <Link href="/affiliate/settings#code" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
              Request a different code <ArrowUpRightIcon className="size-3.5" />
            </Link>
          </Panel>

          <Panel title="How tracking works">
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                `A click is remembered for ${cookieDays} days on that device.`,
                "If they buy any paid plan in that time, the sale is yours.",
                "The last affiliate link they clicked gets the credit.",
                "Your code at checkout counts even without a click.",
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
                  {t}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <ManageTable
        title="Your links"
        items={items}
        getId={(l) => l.id}
        minWidth="52rem"
        searchText={(l) => [l.label, l.sub, destinationName(l.path)]}
        searchPlaceholder="Search links"
        initialSort={{ key: "earned", dir: -1 }}
        columns={[
          {
            key: "label",
            header: "Link",
            sort: (l) => l.label,
            render: (l) => (
              <span className="block min-w-0">
                <span className="block font-medium text-foreground">{l.label}</span>
                <span className="block max-w-[22rem] truncate font-mono text-xs text-muted-foreground">{prettyUrl(referralUrl(code, l.path, l.sub))}</span>
              </span>
            ),
          },
          { key: "page", header: "Opens", sort: (l) => destinationName(l.path), render: (l) => <span className="text-muted-foreground">{destinationName(l.path)}</span> },
          { key: "clicks", header: "Clicks", align: "right", sort: (l) => l.clicks, render: (l) => <span className="tabular-nums">{l.clicks.toLocaleString("en-US")}</span> },
          { key: "sales", header: "Sales", align: "right", sort: (l) => l.sales, render: (l) => <span className="tabular-nums">{l.sales}</span> },
          {
            key: "conv",
            header: "Conv.",
            align: "right",
            sort: (l) => (l.clicks ? l.sales / l.clicks : 0),
            render: (l) => <span className="text-muted-foreground tabular-nums">{l.clicks ? `${((l.sales / l.clicks) * 100).toFixed(1)}%` : "—"}</span>,
          },
          { key: "earned", header: "Earned", align: "right", sort: (l) => l.earned, render: (l) => <span className="font-semibold text-foreground tabular-nums">{usd.format(l.earned)}</span> },
          { key: "created", header: "Created", sort: (l) => l.createdAt, render: (l) => <span className="whitespace-nowrap text-muted-foreground">{date.format(new Date(l.createdAt))}</span> },
          { key: "copy", header: "", render: (l) => <CopyButton text={referralUrl(code, l.path, l.sub)} iconOnly label={`Copy ${l.label} link`} className="size-9 px-0" /> },
        ]}
        actions={(l) => (
          <RowMenu
            label={`Actions for ${l.label}`}
            items={[
              { label: "Open page", icon: ArrowUpRightIcon, href: referralUrl(code, l.path, l.sub), external: true },
              { label: "Delete link", icon: TrashIcon, danger: true, onSelect: () => setDeleting(l) },
            ]}
          />
        )}
        empty={<p className="text-sm text-muted-foreground">No links yet. Create your first one above.</p>}
      />

      {deleting && (
        <ConfirmDialog
          title={`Delete “${deleting.label}”?`}
          body="The link keeps working for anyone who already has it, and sales still count. It just won't show in your list."
          confirmLabel="Delete link"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            remove(deleting.id);
            setDeleting(null);
            show("Link deleted");
          }}
        />
      )}
      {toast}
    </>
  );
}
