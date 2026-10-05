"use client";

import { useState } from "react";
import { deleteSubscriber, saveSubscriber, type Subscriber } from "@/app/(studio)/studio/subscribers/actions";
import { useServerCollection } from "@/lib/studio-store";
import { CheckIcon, DownloadIcon, MailIcon, PauseIcon, TrashIcon, UsersIcon } from "../icons";
import { ConfirmDialog, ManageTable, RowMenu, useToast } from "./manage-table";
import { Kpi, secondaryButton } from "./ui";

const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function exportCsv(rows: Subscriber[]) {
  const csv = [["Email", "Source", "Member", "Subscribed"], ...rows.map((s) => [s.email, s.source, s.member ? "yes" : "no", s.subscribedAt.slice(0, 10)])]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `subscribers-${new Date().toISOString().slice(0, 10)}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

/*
 * Studio → Subscribers: everyone who joined the newsletter from the site.
 * Export the active list as CSV for your email tool (Mailchimp, Brevo, Resend…).
 */
export function SubscriberManager({ seed, today }: { seed: Subscriber[]; today: string }) {
  const { items, save, remove } = useServerCollection(seed, { save: saveSubscriber, remove: deleteSubscriber });
  const [deleting, setDeleting] = useState<Subscriber | null>(null);
  const { show, toast } = useToast();
  const active = items.filter((s) => !s.unsubscribedAt);
  const monthAgo = new Date(Date.parse(today) - 30 * 86_400_000).toISOString();

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon={MailIcon} label="Subscribed" value={active.length.toLocaleString("en-US")} note={`${items.length - active.length} unsubscribed`} />
        <Kpi icon={CheckIcon} label="New in 30 days" value={String(active.filter((s) => s.subscribedAt > monthAgo).length)} />
        <Kpi icon={UsersIcon} label="Also members" value={String(active.filter((s) => s.member).length)} note="Have an account" />
      </ul>
      <ManageTable
        title="Subscribers"
        items={items}
        getId={(s) => s.id}
        minWidth="40rem"
        searchText={(s) => [s.email, s.source]}
        searchPlaceholder="Search email"
        tabs={[
          { key: "active", label: "Subscribed", test: (s: Subscriber) => !s.unsubscribedAt },
          { key: "gone", label: "Unsubscribed", test: (s: Subscriber) => !!s.unsubscribedAt },
          { key: "all", label: "All", test: () => true },
        ]}
        toolbar={
          <button type="button" onClick={() => exportCsv(active)} disabled={!active.length} className={`${secondaryButton} h-10`}>
            <DownloadIcon className="size-4" /> Export CSV
          </button>
        }
        columns={[
          { key: "email", header: "Email", sort: (s) => s.email, render: (s) => <span className="font-medium text-foreground">{s.email}</span> },
          { key: "member", header: "Account", sort: (s) => (s.member ? 1 : 0), render: (s) => <span className="text-muted-foreground">{s.member ? "Member" : "—"}</span> },
          { key: "source", header: "From", sort: (s) => s.source, render: (s) => <span className="text-muted-foreground">{s.source}</span> },
          { key: "date", header: "Subscribed", sort: (s) => s.subscribedAt, render: (s) => <span className="whitespace-nowrap text-muted-foreground">{date.format(new Date(s.subscribedAt))}</span> },
        ]}
        actions={(s) => (
          <RowMenu
            label={`Actions for ${s.email}`}
            items={[
              s.unsubscribedAt
                ? { label: "Subscribe again", icon: CheckIcon, onSelect: () => save({ ...s, unsubscribedAt: null }).then((x) => x && show(`${s.email} subscribed`)) }
                : { label: "Unsubscribe", icon: PauseIcon, onSelect: () => save({ ...s, unsubscribedAt: new Date().toISOString() }).then((x) => x && show(`${s.email} unsubscribed`)) },
              { label: "Delete", icon: TrashIcon, danger: true, onSelect: () => setDeleting(s) },
            ]}
          />
        )}
        empty={<p className="text-muted-foreground">No subscribers yet. They appear here when people use the newsletter form on the site.</p>}
      />
      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.email}?`}
          body="Removes them from the list completely. To stop emailing them but remember they opted out, unsubscribe them instead."
          confirmLabel="Delete"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            const s = deleting;
            setDeleting(null);
            remove(s.id).then((ok) => ok && show(`${s.email} deleted`));
          }}
        />
      )}
      {toast}
    </>
  );
}
