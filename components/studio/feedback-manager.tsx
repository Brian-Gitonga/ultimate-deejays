"use client";

import { useId, useState } from "react";
import { deleteMix, saveFeedback } from "@/app/(studio)/studio/feedback/actions";
import { mixHost, type MixSubmission } from "@/lib/mixes";
import { useServerCollection } from "@/lib/studio-store";
import { ArrowUpRightIcon, CheckIcon, ClockIcon, MessageIcon, TrashIcon } from "../icons";
import { UserAvatar } from "../user-avatar";
import { Drawer } from "./drawer";
import { ConfirmDialog, ManageTable, RowMenu, useToast } from "./manage-table";
import { PlanBadge } from "./student-manager";
import { Field, Kpi, Textarea, primaryButton, secondaryButton } from "./ui";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function waitingFor(iso: string) {
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  return days <= 0 ? "Today" : days === 1 ? "1 day" : `${days} days`;
}

/*
 * Studio → Mix feedback: mixes students sent from their account. Listen, write
 * feedback, save; the student sees it on their "Mix feedback" page.
 */
export function FeedbackManager({ seed }: { seed: MixSubmission[] }) {
  const { items, save, remove } = useServerCollection(seed, { save: saveFeedback, remove: deleteMix });
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<MixSubmission | null>(null);
  const { show, toast } = useToast();
  const open = items.find((m) => m.id === openId) ?? null;
  const pending = items.filter((m) => m.status === "pending");
  const oldest = pending.at(-1);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        <Kpi icon={ClockIcon} label="Waiting for feedback" value={String(pending.length)} note={oldest ? `Oldest has waited ${waitingFor(oldest.createdAt)}` : "All caught up"} />
        <Kpi icon={CheckIcon} label="Reviewed" value={String(items.length - pending.length)} />
        <Kpi icon={MessageIcon} label="All mixes" value={String(items.length)} />
      </ul>

      <ManageTable
        title="Mixes"
        items={items}
        getId={(m) => m.id}
        minWidth="52rem"
        searchText={(m) => [m.name, m.email, m.title, m.courseTitle ?? ""]}
        searchPlaceholder="Search student or mix"
        initialSort={{ key: "date", dir: -1 }}
        onRowClick={(m) => setOpenId(m.id)}
        tabs={[
          { key: "pending", label: "Waiting", test: (m) => m.status === "pending" },
          { key: "reviewed", label: "Reviewed", test: (m) => m.status === "reviewed" },
          { key: "all", label: "All", test: () => true },
        ]}
        columns={[
          {
            key: "student",
            header: "Student",
            sort: (m) => m.name,
            render: (m) => (
              <span className="flex items-center gap-3">
                <UserAvatar src={m.avatar} name={m.name} pixels={64} className="size-8 text-xs" />
                <span className="min-w-0">
                  <span className="block font-medium text-foreground">
                    {m.name}
                    {m.isDemo && <span className="ml-2 rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[0.6875rem] font-normal text-muted-foreground">demo</span>}
                  </span>
                  {m.email && <span className="block truncate text-xs text-muted-foreground">{m.email}</span>}
                </span>
              </span>
            ),
          },
          {
            key: "mix",
            header: "Mix",
            sort: (m) => m.title,
            render: (m) => (
              <span className="block max-w-xs">
                <span className="block truncate font-medium text-foreground">{m.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {mixHost(m.link)}
                  {m.courseTitle ? ` · ${m.courseTitle}` : ""}
                </span>
              </span>
            ),
          },
          { key: "plan", header: "Plan", sort: (m) => m.plan, render: (m) => (m.plan ? <PlanBadge plan={m.plan as "warm-up" | "resident" | "headliner"} /> : <span className="text-muted-foreground">–</span>) },
          {
            key: "status",
            header: "Status",
            sort: (m) => m.status,
            render: (m) =>
              m.status === "pending" ? (
                <span className="text-sm font-medium text-[#b37400] dark:text-accent-amber">Waiting {waitingFor(m.createdAt)}</span>
              ) : (
                <span className="text-sm text-brand-deep dark:text-brand">Reviewed</span>
              ),
          },
          { key: "date", header: "Sent", sort: (m) => m.createdAt, render: (m) => <span className="whitespace-nowrap text-muted-foreground">{dateFormat.format(new Date(m.createdAt))}</span> },
        ]}
        actions={(m) => (
          <RowMenu
            label={`Actions for ${m.title}`}
            items={[
              { label: m.status === "pending" ? "Write feedback" : "Edit feedback", icon: MessageIcon, onSelect: () => setOpenId(m.id) },
              { label: "Open mix", icon: ArrowUpRightIcon, href: m.link, external: true },
              { label: "Delete", icon: TrashIcon, danger: true, onSelect: () => setConfirm(m) },
            ]}
          />
        )}
        empty={<p className="text-muted-foreground">No mixes here. Resident and Headliner students send mixes from their account.</p>}
      />

      {open && (
        <FeedbackDrawer
          key={open.id}
          mix={open}
          onClose={() => setOpenId(null)}
          onSave={(feedback) =>
            save({ ...open, feedback }).then((saved) => {
              if (!saved) return;
              setOpenId(null);
              show(feedback ? `Feedback sent to ${open.name}` : "Feedback removed");
            })
          }
        />
      )}
      {confirm && (
        <ConfirmDialog
          title="Delete this mix?"
          body={`"${confirm.title}" and any feedback on it are removed. If it was within their plan's allowance, the student can send another.`}
          confirmLabel="Delete mix"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const mix = confirm;
            setConfirm(null);
            setOpenId(null);
            remove(mix.id).then((done) => done && show("Mix deleted"));
          }}
        />
      )}
      {toast}
    </>
  );
}

function FeedbackDrawer({ mix, onClose, onSave }: { mix: MixSubmission; onClose: () => void; onSave: (feedback: string) => void }) {
  const titleId = useId();
  const [feedback, setFeedback] = useState(mix.feedback);

  return (
    <Drawer
      titleId={titleId}
      onClose={onClose}
      header={
        <>
          <h2 id={titleId} className="text-lg font-semibold text-foreground">
            {mix.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {mix.name} · {dateFormat.format(new Date(mix.createdAt))}
          </p>
        </>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <a href={mix.link} target="_blank" rel="noreferrer" className={secondaryButton}>
            Listen on {mixHost(mix.link)} <ArrowUpRightIcon className="size-4" />
          </a>
          <button type="button" disabled={feedback.trim() === mix.feedback} onClick={() => onSave(feedback.trim())} className={primaryButton}>
            {mix.status === "pending" ? "Send feedback" : "Update feedback"}
          </button>
        </div>
      }
    >
      {mix.notes && (
        <div className="rounded-xl bg-muted/60 p-4">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">They asked</p>
          <p className="mt-1 text-[0.9375rem] text-foreground">{mix.notes}</p>
        </div>
      )}
      {mix.courseTitle && (
        <p className="text-sm text-muted-foreground">
          From the course <span className="font-medium text-foreground">{mix.courseTitle}</span>
        </p>
      )}
      <Field label="Your feedback" htmlFor="mix-feedback" hint="The student sees this on their Mix feedback page. Timestamps help: “At 12:30, cut the bass earlier.”">
        <Textarea id="mix-feedback" rows={10} maxLength={5000} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
      </Field>
    </Drawer>
  );
}
