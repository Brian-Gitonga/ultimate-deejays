"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { plans, type Plan } from "@/lib/plans";
import { averageProgress, type Student } from "@/lib/students";
import { useCollection } from "@/lib/studio-store";
import { CloseIcon, DownloadIcon, LessonIcon, MailIcon, MessageIcon, TrophyIcon, UsersIcon, WalletIcon } from "../icons";
import { ConfirmDialog, ManageTable, RowMenu, useToast } from "./manage-table";
import { Kpi, Select, secondaryButton } from "./ui";

const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const money = (n: number) => `$${n.toLocaleString("en-US")}`;
export const planName = (slug: string) => plans.find((p) => p.slug === slug)?.name ?? slug;

// Plans are ordered tiers, so they use one hue from light to dark (always shown with a label).
export const planTone: Record<Plan["slug"], { bar: string; pill: string }> = {
  "warm-up": { bar: "bg-[#9fdcc4] dark:bg-[#2e6b58]", pill: "bg-foreground/[0.06] text-foreground/80" },
  resident: { bar: "bg-[#00a76f]", pill: "bg-brand/10 text-brand-deep dark:text-brand" },
  headliner: { bar: "bg-[#00584c] dark:bg-[#8ff0c9]", pill: "bg-[#00584c] text-white dark:bg-[#8ff0c9] dark:text-neutral-900" },
};

function daysAgo(iso: string) {
  const days = Math.round((Date.parse(new Date().toISOString().slice(0, 10)) - Date.parse(iso)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return date.format(new Date(iso));
}

export function Avatar({ student, size = "size-9" }: { student: Pick<Student, "name" | "avatar">; size?: string }) {
  if (student.avatar) return <Image src={student.avatar} alt="" width={96} height={96} className={`${size} shrink-0 rounded-full object-cover`} />;
  const initials = student.name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-foreground/[0.08] text-xs font-semibold text-foreground/80`} aria-hidden="true">
      {initials}
    </span>
  );
}

export function PlanBadge({ plan }: { plan: Plan["slug"] }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${planTone[plan].pill}`}>{planName(plan)}</span>;
}

function exportCsv(students: Student[]) {
  const header = ["Name", "Email", "Plan", "Status", "Country", "Joined", "Last active", "Courses", "Avg progress %", "Paid USD"];
  const rows = students.map((s) => [s.name, s.email, planName(s.plan), s.status, s.country, s.joinedAt, s.lastActiveAt, s.enrollments.length, averageProgress(s), s.paid]);
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `students-${new Date().toISOString().slice(0, 10)}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

export function StudentManager({ seed }: { seed: Student[] }) {
  const { items, save, remove } = useCollection("students", seed);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ student: Student; action: "delete" | "suspend" } | null>(null);
  const { show, toast } = useToast();
  const open = items.find((s) => s.id === openId) ?? null;

  const active7 = items.filter((s) => Date.parse(new Date().toISOString().slice(0, 10)) - Date.parse(s.lastActiveAt) <= 7 * 86_400_000).length;
  const paying = items.filter((s) => s.paid > 0);
  const revenue = paying.reduce((sum, s) => sum + s.paid, 0);
  const avg = items.length ? Math.round(items.reduce((sum, s) => sum + averageProgress(s), 0) / items.length) : 0;
  const byPlan = plans.map((p) => ({ plan: p, count: items.filter((s) => s.plan === p.slug).length }));

  function setStatus(student: Student, status: Student["status"]) {
    save({ ...student, status });
    show(status === "suspended" ? `${student.name} suspended` : `${student.name} reactivated`);
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon={UsersIcon} label="Total students" value={String(items.length)} />
        <Kpi icon={LessonIcon} label="Active in last 7 days" value={String(active7)} note={`${items.length ? Math.round((active7 / items.length) * 100) : 0}% of students`} />
        <Kpi icon={WalletIcon} label="Paid plans" value={String(paying.length)} note={`${money(revenue)} lifetime revenue`} />
        <Kpi icon={TrophyIcon} label="Average progress" value={`${avg}%`} note="Across all enrolled courses" />
      </ul>

      <section aria-labelledby="plan-mix" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 id="plan-mix" className="text-base font-semibold text-foreground">
          Students by plan
        </h2>
        <div className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={byPlan.map((b) => `${b.count} on ${b.plan.name}`).join(", ")}>
          {byPlan.map((b) => (b.count ? <span key={b.plan.slug} className={planTone[b.plan.slug].bar} style={{ flexGrow: b.count }} /> : null))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {byPlan.map((b) => (
            <li key={b.plan.slug} className="flex items-center gap-2 text-muted-foreground">
              <span className={`size-2.5 rounded-full ${planTone[b.plan.slug].bar}`} />
              {b.plan.name}
              <span className="font-semibold text-foreground tabular-nums">{b.count}</span>
              <span className="tabular-nums">({items.length ? Math.round((b.count / items.length) * 100) : 0}%)</span>
            </li>
          ))}
        </ul>
      </section>

      <ManageTable
        title="Students"
        items={items}
        getId={(s) => s.id}
        minWidth="58rem"
        searchText={(s) => [s.name, s.email, s.city, s.country]}
        searchPlaceholder="Search name, email, city"
        initialSort={{ key: "joined", dir: -1 }}
        onRowClick={(s) => setOpenId(s.id)}
        toolbar={
          <button type="button" onClick={() => exportCsv(items)} className={`${secondaryButton} h-10`}>
            <DownloadIcon className="size-4" /> Export CSV
          </button>
        }
        tabs={[
          { key: "all", label: "All", test: () => true },
          ...plans.map((p) => ({ key: p.slug, label: p.name, test: (s: Student) => s.plan === p.slug })),
          { key: "suspended", label: "Suspended", test: (s: Student) => s.status === "suspended" },
        ]}
        columns={[
          {
            key: "name",
            header: "Student",
            sort: (s) => s.name,
            render: (s) => (
              <button type="button" onClick={() => setOpenId(s.id)} className="flex items-center gap-3 text-left">
                <Avatar student={s} />
                <span className="min-w-0">
                  <span className="block font-medium text-foreground hover:text-brand">{s.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{s.email}</span>
                </span>
              </button>
            ),
          },
          { key: "plan", header: "Plan", sort: (s) => plans.findIndex((p) => p.slug === s.plan), render: (s) => <PlanBadge plan={s.plan} /> },
          { key: "courses", header: "Courses", align: "right", sort: (s) => s.enrollments.length, render: (s) => <span className="tabular-nums">{s.enrollments.length}</span> },
          {
            key: "progress",
            header: "Avg progress",
            sort: (s) => averageProgress(s),
            render: (s) => (
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-20 overflow-hidden rounded-full bg-foreground/10">
                  <span className="block h-full rounded-full bg-brand" style={{ width: `${averageProgress(s)}%` }} />
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">{averageProgress(s)}%</span>
              </span>
            ),
          },
          { key: "location", header: "Location", sort: (s) => s.country, render: (s) => <span className="text-muted-foreground">{s.city}, {s.country}</span> },
          { key: "joined", header: "Joined", sort: (s) => s.joinedAt, render: (s) => <span className="whitespace-nowrap text-muted-foreground">{date.format(new Date(s.joinedAt))}</span> },
          { key: "active", header: "Last active", sort: (s) => s.lastActiveAt, render: (s) => <span className="whitespace-nowrap text-muted-foreground">{daysAgo(s.lastActiveAt)}</span> },
          {
            key: "status",
            header: "Status",
            sort: (s) => s.status,
            render: (s) =>
              s.status === "active" ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                  <span className="size-2 rounded-full bg-brand" /> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                  <CloseIcon className="size-3.5" strokeWidth={3} /> Suspended
                </span>
              ),
          },
        ]}
        actions={(s) => (
          <RowMenu
            label={`Actions for ${s.name}`}
            items={[
              { label: "View profile", icon: UsersIcon, onSelect: () => setOpenId(s.id) },
              { label: "Email student", icon: MailIcon, href: `mailto:${s.email}` },
              s.status === "active"
                ? { label: "Suspend", icon: CloseIcon, onSelect: () => setConfirm({ student: s, action: "suspend" }) }
                : { label: "Reactivate", icon: UsersIcon, onSelect: () => setStatus(s, "active") },
              { label: "Delete account", icon: CloseIcon, danger: true, onSelect: () => setConfirm({ student: s, action: "delete" }) },
            ]}
          />
        )}
        empty={<p className="text-muted-foreground">No students yet. They&apos;ll appear here when people sign up.</p>}
      />

      {open && (
        <StudentDrawer
          student={open}
          onClose={() => setOpenId(null)}
          onPlanChange={(plan) => {
            const price = plans.find((p) => p.slug === plan)!.price;
            save({ ...open, plan, paid: Math.max(open.paid, price) });
            show(`${open.name} moved to ${planName(plan)}`);
          }}
          onSuspend={() => setConfirm({ student: open, action: "suspend" })}
          onReactivate={() => setStatus(open, "active")}
          onDelete={() => setConfirm({ student: open, action: "delete" })}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.action === "delete" ? `Delete ${confirm.student.name}'s account?` : `Suspend ${confirm.student.name}?`}
          body={
            confirm.action === "delete"
              ? "Their progress, notes and challenge entries are removed permanently. This can't be undone."
              : "They won't be able to log in or watch lessons until you reactivate them. Their progress is kept."
          }
          confirmLabel={confirm.action === "delete" ? "Delete account" : "Suspend student"}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm.action === "delete") {
              remove(confirm.student.id);
              setOpenId(null);
              show(`Deleted ${confirm.student.name}`);
            } else setStatus(confirm.student, "suspended");
            setConfirm(null);
          }}
        />
      )}
      {toast}
    </>
  );
}

function StudentDrawer({
  student: s,
  onClose,
  onPlanChange,
  onSuspend,
  onReactivate,
  onDelete,
}: {
  student: Student;
  onClose: () => void;
  onPlanChange: (plan: Plan["slug"]) => void;
  onSuspend: () => void;
  onReactivate: () => void;
  onDelete: () => void;
}) {
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

  const lessonsDone = s.enrollments.reduce((sum, e) => sum + Math.round(e.progress / 14), 0);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-dvh">
      <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-name"
        data-lenis-prevent
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-background shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="flex items-center gap-4">
            <Avatar student={s} size="size-14" />
            <div className="min-w-0">
              <h2 id="student-name" className="text-lg font-semibold text-foreground">
                {s.name}
              </h2>
              <p className="truncate text-sm text-muted-foreground">{s.email}</p>
              <p className="text-sm text-muted-foreground">
                {s.city}, {s.country}
              </p>
            </div>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-foreground/5">
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain p-5">
          {s.status === "suspended" && (
            <p role="status" className="rounded-xl border border-red-500/30 bg-red-500/[0.07] px-4 py-3 text-sm text-red-700 dark:text-red-300">
              This account is suspended. They can&apos;t log in or watch lessons.
            </p>
          )}

          <dl className="grid grid-cols-2 gap-3">
            {[
              { label: "Courses", value: s.enrollments.length, icon: LessonIcon },
              { label: "Avg progress", value: `${averageProgress(s)}%`, icon: TrophyIcon },
              { label: "Mixes submitted", value: s.mixesSubmitted, icon: MessageIcon },
              { label: "Challenge entries", value: s.challengeEntries, icon: TrophyIcon },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse rounded-xl border border-border p-3">
                <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                <dd className="text-xl font-bold text-foreground tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="plan-heading">
            <h3 id="plan-heading" className="text-sm font-semibold text-foreground">
              Plan
            </h3>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex-1">
                <Select aria-label="Change plan" value={s.plan} onChange={(e) => onPlanChange(e.target.value as Plan["slug"])}>
                  {plans.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name} {p.price ? `($${p.price} one-time)` : "(free)"}
                    </option>
                  ))}
                </Select>
              </div>
              <PlanBadge plan={s.plan} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Paid {money(s.paid)} · Joined {date.format(new Date(s.joinedAt))} · Last active {daysAgo(s.lastActiveAt).toLowerCase()}
            </p>
          </section>

          <section aria-labelledby="enroll-heading">
            <h3 id="enroll-heading" className="text-sm font-semibold text-foreground">
              Enrolled courses
            </h3>
            <ul className="mt-2 space-y-3">
              {s.enrollments.map((e) => (
                <li key={e.course} className="rounded-xl border border-border p-3">
                  <Link href={`/studio/courses/${e.course}/edit`} className="line-clamp-1 text-sm font-medium text-foreground hover:text-brand">
                    {e.title}
                  </Link>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${e.progress}%` }} />
                    </div>
                    <span className="text-xs font-medium text-foreground tabular-nums">{e.progress}%</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Enrolled {date.format(new Date(e.enrolledAt))}</p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="activity-heading">
            <h3 id="activity-heading" className="text-sm font-semibold text-foreground">
              Recent activity
            </h3>
            <ol className="mt-3 space-y-3 border-l border-border pl-4 text-sm">
              <li>
                <span className="text-foreground">Active on the site</span>
                <span className="block text-xs text-muted-foreground">{daysAgo(s.lastActiveAt)}</span>
              </li>
              {lessonsDone > 0 && (
                <li>
                  <span className="text-foreground">Completed {lessonsDone} lessons in total</span>
                  <span className="block text-xs text-muted-foreground">Across {s.enrollments.length} courses</span>
                </li>
              )}
              <li>
                <span className="text-foreground">Joined on the {planName(s.plan)} plan</span>
                <span className="block text-xs text-muted-foreground">{date.format(new Date(s.joinedAt))}</span>
              </li>
            </ol>
          </section>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-border p-5">
          <a href={`mailto:${s.email}`} className={secondaryButton}>
            <MailIcon className="size-4" /> Email
          </a>
          {s.status === "active" ? (
            <button type="button" onClick={onSuspend} className={secondaryButton}>
              Suspend
            </button>
          ) : (
            <button type="button" onClick={onReactivate} className={secondaryButton}>
              Reactivate
            </button>
          )}
          <button type="button" onClick={onDelete} className="col-span-2 inline-flex h-10 items-center justify-center rounded-lg text-sm font-semibold text-red-600 hover:bg-red-500/10 dark:text-red-400">
            Delete account
          </button>
        </div>
      </aside>
    </div>
  );
}
