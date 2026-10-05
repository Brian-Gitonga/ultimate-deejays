import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import {
  ArrowRightIcon,
  HandshakeIcon,
  LessonIcon,
  MessageIcon,
  PlusIcon,
  StarIcon,
  TrendUpIcon,
  TrophyIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons";
import { RevenueChart } from "@/components/revenue-chart";
import { StatusBadge, statusMeta } from "@/components/studio/status";
import { PlanBadge } from "@/components/studio/student-manager";
import { UserAvatar } from "@/components/user-avatar";
import { displayName, requireAdmin } from "@/lib/dal";
import { getDashboard, type Dashboard } from "@/lib/db/studio/dashboard";
import { getSiteSettings } from "@/lib/db/settings";
import { moneyFormatter } from "@/lib/money";

// The layout title template does not apply to a page in the same segment, so the full title is spelled out.
export const metadata: Metadata = { title: { absolute: "Dashboard | Studio | Ultimate Deejays" } };

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const todoIcons: Record<Dashboard["todos"][number]["key"], ComponentType<SVGProps<SVGSVGElement>>> = {
  mixes: MessageIcon,
  entries: TrophyIcon,
  affiliates: HandshakeIcon,
  reviews: StarIcon,
};

const sourceLabel: Record<string, string> = { self: "Started", admin: "Added by admin", purchase: "Purchase" };

export default async function StudioDashboardPage() {
  const [admin, d, settings] = await Promise.all([requireAdmin(), getDashboard(), getSiteSettings()]);
  const currency = settings.general.currency;
  const money = moneyFormatter(currency, 0);
  const firstName = displayName(admin).split(" ")[0];
  const statusCounts = (["published", "review", "draft"] as const).map((s) => ({ status: s, count: d.courses.filter((c) => c.status === s).length }));
  const published = d.courses.filter((c) => c.status === "published").sort((a, b) => b.students - a.students).slice(0, 6);
  const maxStudents = Math.max(1, ...published.map((c) => c.students));
  const yearTotal = d.revenue.reduce((sum, m) => sum + (m.value ?? 0), 0);
  const waiting = d.todos.reduce((sum, t) => sum + t.count, 0);

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        {/* Greeting */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-brand">Admin Studio</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">Welcome back, {firstName} 👋</h1>
            <p className="mt-1 text-muted-foreground">
              {waiting ? `${waiting} ${waiting === 1 ? "thing needs" : "things need"} your attention.` : "You're all caught up."}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/studio/courses" className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground shadow-xs hover:bg-muted">
              Manage courses
            </Link>
            <Link
              href="/studio/courses/new"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgb(0_167_111/0.7)] hover:brightness-110"
            >
              <PlusIcon className="size-4" />
              New course
            </Link>
          </div>
        </div>

        {/* KPI tiles */}
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Kpi icon={WalletIcon} tone="bg-brand/10 text-brand" label="Revenue this month" value={money(d.stats.revenueThisMonth)} change={d.stats.revenueChange} note="No sales last month" />
          <Kpi
            icon={UsersIcon}
            tone="bg-accent-blue/10 text-accent-blue dark:text-[#7aa7ff]"
            label="Students"
            value={d.stats.students.toLocaleString("en-US")}
            change={d.stats.studentsChange}
            note={`${d.stats.newStudents30d} joined in the last 30 days`}
          />
          <Kpi icon={LessonIcon} tone="bg-accent-indigo/10 text-accent-indigo" label="Enrollments (30 days)" value={String(d.stats.enrollments30d)} change={d.stats.enrollmentsChange} note="Courses started" />
          <Kpi
            icon={StarIcon}
            tone="bg-accent-amber/15 text-[#b37400] dark:text-accent-amber"
            label="Average rating"
            value={d.stats.reviews ? d.stats.rating.toFixed(1) : "–"}
            note={`${d.stats.reviews.toLocaleString("en-US")} reviews`}
          />
        </ul>

        {/* Revenue + side column */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Card title="Revenue this year" action={<span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{d.year} · {currency}</span>}>
            <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{money(yearTotal)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {yearTotal ? "Plan purchases, before fees and refunds." : "No sales yet this year. Payments appear here once checkout is live (or after running the demo-data script)."}
            </p>
            <div className="mt-6">
              <RevenueChart data={d.revenue} year={d.year} />
            </div>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
            <div className="relative isolate overflow-hidden rounded-2xl bg-neutral-900 p-6 text-white dark:bg-card dark:ring-1 dark:ring-border">
              <div aria-hidden="true" className="absolute -top-20 -right-16 -z-10 size-56 rounded-full bg-brand/40 blur-3xl" />
              <p className="text-sm text-white/70">Available balance</p>
              <p className="mt-1 text-[2rem] font-bold tracking-tight tabular-nums">{money(d.stats.availableBalance)}</p>
              <p className="mt-1 text-xs text-white/60">{d.stats.inTransit ? `${money(d.stats.inTransit)} on its way to you` : "Net of fees, commission, refunds and payouts"}</p>
              <div className="mt-5 flex gap-2">
                <Link href="/studio/earnings?payout=1" className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-white text-sm font-semibold text-neutral-900 hover:bg-white/90">
                  Request payout
                </Link>
                <Link href="/studio/earnings#payouts" className="inline-flex h-10 items-center justify-center rounded-lg border border-white/20 px-3 text-sm font-medium hover:bg-white/10">
                  History
                </Link>
              </div>
            </div>

            <Card title="Needs your attention">
              <ul className="-my-2 divide-y divide-border">
                {d.todos.map((todo) => {
                  const Icon = todoIcons[todo.key];
                  return (
                    <li key={todo.key}>
                      <Link href={todo.href} className="group flex items-center gap-3 py-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/70">
                          <Icon className="size-4" />
                        </span>
                        <span className="flex-1 text-sm text-foreground group-hover:text-brand">{todo.label}</span>
                        <span
                          className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold ${
                            todo.count ? "bg-foreground text-background" : "bg-foreground/[0.06] text-muted-foreground"
                          }`}
                        >
                          {todo.count}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </div>

        {/* Course status + top courses */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Course status" action={<ViewAll href="/studio/courses" />}>
            <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-foreground/[0.06]" role="img" aria-label={statusCounts.map((s) => `${s.count} ${statusMeta[s.status].label}`).join(", ")}>
              {statusCounts.map((s) => (s.count ? <span key={s.status} className={statusMeta[s.status].dot} style={{ flexGrow: s.count }} /> : null))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {statusCounts.map((s) => (
                <li key={s.status} className="flex items-center gap-2 text-muted-foreground">
                  <span className={`size-2.5 rounded-full ${statusMeta[s.status].dot}`} />
                  {statusMeta[s.status].label}
                  <span className="font-semibold text-foreground">{s.count}</span>
                </li>
              ))}
            </ul>

            <ul className="mt-5 divide-y divide-border border-t border-border">
              {d.courses.slice(0, 6).map((course) => (
                <li key={course.id}>
                  <Link href={`/studio/courses/${course.id}/edit`} className="group flex items-center gap-3 py-3">
                    <Image src={course.image} alt="" width={96} height={64} className="h-11 w-16 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground group-hover:text-brand">{course.title}</p>
                      <p className="text-xs text-muted-foreground">Updated {shortDate.format(new Date(course.updatedAt))}</p>
                    </div>
                    <StatusBadge status={course.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Top courses by students" action={<ViewAll href="/studio/courses" />}>
            {published.length ? (
              <ul className="space-y-5">
                {published.map((course) => (
                  <li key={course.id}>
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="truncate font-medium text-foreground">{course.title}</span>
                      <span className="shrink-0 font-semibold text-foreground tabular-nums">{course.students.toLocaleString("en-US")}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-foreground/[0.06]">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${(course.students / maxStudents) * 100}%` }} />
                    </div>
                    <div className="mt-1.5 flex gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <StarIcon fill="currentColor" className="size-3 text-accent-amber" />
                        {course.reviews ? course.rating.toFixed(1) : "No ratings"}
                      </span>
                      <span>{course.reviews.toLocaleString("en-US")} reviews</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No published courses yet.</p>
            )}
          </Card>
        </div>

        {/* Enrollments + reviews */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card title="Recent enrollments" action={<ViewAll href="/studio/students" />} flush>
            {d.enrollments.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] text-sm">
                  <thead>
                    <tr className="border-y border-border bg-muted/50 text-left text-xs text-muted-foreground">
                      <th scope="col" className="px-6 py-2.5 font-medium">Student</th>
                      <th scope="col" className="px-3 py-2.5 font-medium">Course</th>
                      <th scope="col" className="px-3 py-2.5 font-medium">Plan</th>
                      <th scope="col" className="px-3 py-2.5 font-medium">How</th>
                      <th scope="col" className="px-6 py-2.5 text-right font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {d.enrollments.map((e) => (
                      <tr key={e.id} className="transition hover:bg-muted/40">
                        <td className="px-6 py-3">
                          <span className="flex items-center gap-2.5">
                            <UserAvatar src={e.avatar} name={e.student} pixels={64} className="size-8 text-xs" />
                            <span className="font-medium text-foreground">{e.student}</span>
                          </span>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{e.course}</td>
                        <td className="px-3 py-3">
                          <PlanBadge plan={e.plan} />
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{sourceLabel[e.source] ?? e.source}</td>
                        <td className="px-6 py-3 text-right text-muted-foreground">{shortDate.format(new Date(e.date))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No enrollments yet. A student is enrolled the first time they open a course while signed in.</p>
            )}
          </Card>

          <Card title="Latest reviews" action={<ViewAll href="/studio/reviews" />}>
            {d.reviews.length ? (
              <ul className="space-y-5">
                {d.reviews.map((r) => (
                  <li key={r.id} className="flex gap-3">
                    <UserAvatar src={r.avatar} name={r.student} pixels={64} className="size-9 text-xs" />
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-x-2 text-sm">
                        <span className="font-semibold text-foreground">{r.student}</span>
                        <span className="inline-flex text-accent-amber" aria-label={`${r.rating} out of 5 stars`}>
                          {Array.from({ length: 5 }, (_, i) => (
                            <StarIcon key={i} fill={i < r.rating ? "currentColor" : "none"} className="size-3.5" />
                          ))}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.course} · {shortDate.format(new Date(r.date))}
                      </p>
                      {r.text && <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{r.text}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            )}
          </Card>
        </div>

        {/* Payouts */}
        <Card title="Payouts" action={<ViewAll href="/studio/earnings#payouts" />} flush>
          {d.payouts.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-sm">
                <thead>
                  <tr className="border-y border-border bg-muted/50 text-left text-xs text-muted-foreground">
                    <th scope="col" className="px-6 py-2.5 font-medium">Payout</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Destination</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Amount</th>
                    <th scope="col" className="px-6 py-2.5 text-right font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {d.payouts.map((p) => (
                    <tr key={p.id} className="transition hover:bg-muted/40">
                      <td className="px-6 py-3 font-medium text-foreground">{p.reference}</td>
                      <td className="px-3 py-3 text-muted-foreground">{p.destination}</td>
                      <td className="px-3 py-3">{p.status === "paid" ? <StatusBadge status="published" label="Paid" /> : <StatusBadge status="review" label="In transit" />}</td>
                      <td className="px-3 py-3 text-right font-semibold text-foreground tabular-nums">{money(p.amount)}</td>
                      <td className="px-6 py-3 text-right text-muted-foreground">{shortDate.format(new Date(p.date))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-6 pb-6 text-sm text-muted-foreground">No payouts yet.</p>
          )}
        </Card>
      </div>
    </main>
  );
}

function Card({ title, action, flush = false, children }: { title: string; action?: ReactNode; flush?: boolean; children: ReactNode }) {
  const id = `studio-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className={`min-w-0 rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)] ${flush ? "" : "p-6"}`}>
      <div className={`flex items-center justify-between gap-4 ${flush ? "px-6 pt-6 pb-4" : "mb-5"}`}>
        <h2 id={id} className="text-base font-semibold text-foreground">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ViewAll({ href }: { href: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
      View all
      <ArrowRightIcon className="size-3.5 transition group-hover:translate-x-0.5" />
    </Link>
  );
}

function Kpi({
  icon: Icon,
  tone,
  label,
  value,
  change,
  note,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone: string;
  label: string;
  value: string;
  /** % vs last period; null = nothing to compare with (the note shows instead) */
  change?: number | null;
  note?: string;
}) {
  const up = (change ?? 0) >= 0;
  return (
    <li className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={`hidden size-10 shrink-0 items-center justify-center rounded-xl sm:flex ${tone}`}>
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-2 text-2xl leading-none font-bold tracking-tight text-foreground tabular-nums sm:text-[1.75rem]">{value}</p>
      <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {change !== undefined && change !== null ? (
          <>
            <span
              className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold ${
                up ? "bg-brand/10 text-brand-deep dark:text-brand" : "bg-red-500/10 text-red-700 dark:text-red-400"
              }`}
            >
              <TrendUpIcon className={`size-3 ${up ? "" : "rotate-180 -scale-x-100"}`} />
              {up ? "+" : ""}
              {change}%
            </span>
            vs last period
          </>
        ) : (
          note
        )}
      </p>
    </li>
  );
}
