import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import {
  ArrowRightIcon,
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
import { getStudioDashboard } from "@/lib/studio";

// The layout title template does not apply to a page in the same segment, so the full title is spelled out.
export const metadata: Metadata = { title: { absolute: "Dashboard | Studio | Ultimate Deejays" } };

const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export default function StudioDashboardPage() {
  const d = getStudioDashboard();
  const firstName = d.instructor.name.split(" ")[0];
  const statusCounts = (["published", "review", "draft"] as const).map((s) => ({
    status: s,
    count: d.myCourses.filter((c) => c.status === s).length,
  }));
  const published = d.myCourses.filter((c) => c.status === "published").sort((a, b) => b.students - a.students);
  const maxStudents = Math.max(...published.map((c) => c.students));
  const yearTotal = d.revenue.reduce((sum, m) => sum + (m.value ?? 0), 0);
  const months = d.revenue.filter((m) => m.value !== null) as { month: string; value: number }[];
  const growth = Math.round(((months.at(-1)!.value - months[0].value) / months[0].value) * 100);

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        {/* Greeting */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-brand">Instructor Studio</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">Welcome back, {firstName} 👋</h1>
            <p className="mt-1 text-muted-foreground">Here&apos;s how your courses are doing this month.</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/studio/courses"
              className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground shadow-xs hover:bg-muted"
            >
              Manage courses
            </Link>
            <Link
              href="/studio/courses/new"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgb(0_167_111/0.7)] hover:brightness-110"
            >
              <PlusIcon className="size-4" />
              Upload course
            </Link>
          </div>
        </div>

        {/* KPI tiles */}
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Kpi icon={WalletIcon} tone="bg-brand/10 text-brand" label="Revenue this month" value={money(d.stats.revenueThisMonth)} change={d.stats.revenueChange} />
          <Kpi icon={UsersIcon} tone="bg-accent-blue/10 text-accent-blue dark:text-[#7aa7ff]" label="Total students" value={d.stats.students.toLocaleString("en-US")} change={d.stats.studentsChange} />
          <Kpi icon={LessonIcon} tone="bg-accent-indigo/10 text-accent-indigo" label="Enrollments (30 days)" value={String(d.stats.enrollments30d)} change={d.stats.enrollmentsChange} />
          <Kpi icon={StarIcon} tone="bg-accent-amber/15 text-[#b37400] dark:text-accent-amber" label="Average rating" value={d.stats.rating.toFixed(1)} note={`${d.stats.reviews} reviews`} />
        </ul>

        {/* Revenue + side column */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Card
            title="Revenue this year"
            action={
              <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">2026 · USD</span>
            }
          >
            <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{money(yearTotal)}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium text-brand-deep dark:text-brand">
                <TrendUpIcon className="size-4" />
                +{growth}%
              </span>
              monthly revenue, {months[0].month} to {months.at(-1)!.month}
            </p>
            <div className="mt-6">
              <RevenueChart data={d.revenue} year={2026} />
            </div>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
            <div className="relative isolate overflow-hidden rounded-2xl bg-neutral-900 p-6 text-white dark:bg-card dark:ring-1 dark:ring-border">
              <div aria-hidden="true" className="absolute -top-20 -right-16 -z-10 size-56 rounded-full bg-brand/40 blur-3xl" />
              <p className="text-sm text-white/70">Available balance</p>
              <p className="mt-1 text-[2rem] font-bold tracking-tight tabular-nums">{money(d.stats.availableBalance)}</p>
              <p className="mt-1 text-xs text-white/60">Next automatic payout: October 30</p>
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
                {d.todos.map((todo, i) => {
                  const Icon = [MessageIcon, TrophyIcon, UsersIcon][i];
                  return (
                    <li key={todo.label}>
                      <Link href={todo.href} className="group flex items-center gap-3 py-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/70">
                          <Icon className="size-4" />
                        </span>
                        <span className="flex-1 text-sm text-foreground group-hover:text-brand">{todo.label}</span>
                        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-foreground px-2 text-xs font-semibold text-background">
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
            <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={statusCounts.map((s) => `${s.count} ${statusMeta[s.status].label}`).join(", ")}>
              {statusCounts.map((s) =>
                s.count ? <span key={s.status} className={statusMeta[s.status].dot} style={{ flexGrow: s.count }} /> : null,
              )}
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
              {d.myCourses.map((course) => {
                return (
                  <li key={course.slug} className="flex items-center gap-3 py-3">
                    <Image src={course.image} alt="" width={96} height={64} className="h-11 w-16 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{course.title}</p>
                      <p className="text-xs text-muted-foreground">Updated {shortDate.format(new Date(course.updatedAt))}</p>
                    </div>
                    <StatusBadge status={course.status} />
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card title="Top courses by students" action={<ViewAll href="/studio/courses" />}>
            <ul className="space-y-5">
              {published.map((course) => (
                <li key={course.slug}>
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
                      {course.rating.toFixed(1)}
                    </span>
                    <span>{money(course.revenue)} earned</span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Enrollments + reviews */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card title="Recent enrollments" action={<ViewAll href="/studio/students" />} flush>
            <div className="overflow-x-auto" data-lenis-prevent-horizontal>
              <table className="w-full min-w-[34rem] text-sm">
                <thead>
                  <tr className="border-y border-border bg-muted/50 text-left text-xs text-muted-foreground">
                    <th scope="col" className="px-6 py-2.5 font-medium">Student</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Course</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Plan</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Amount</th>
                    <th scope="col" className="px-6 py-2.5 text-right font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {d.enrollments.map((e) => (
                    <tr key={`${e.student}-${e.date}`} className="transition hover:bg-muted/40">
                      <td className="px-6 py-3">
                        <span className="flex items-center gap-2.5">
                          <Image src={e.avatar} alt="" width={64} height={64} className="size-8 rounded-full object-cover" />
                          <span className="font-medium text-foreground">{e.student}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{e.course}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-xs font-medium text-foreground/80">{e.plan}</span>
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-foreground tabular-nums">{e.amount ? money(e.amount) : "Free"}</td>
                      <td className="px-6 py-3 text-right text-muted-foreground">{shortDate.format(new Date(e.date))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Latest reviews" action={<ViewAll href="/studio/reviews" />}>
            <ul className="space-y-5">
              {d.reviews.map((r) => (
                <li key={`${r.student}-${r.date}`} className="flex gap-3">
                  <Image src={r.avatar} alt="" width={64} height={64} className="size-9 shrink-0 rounded-full object-cover" />
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
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{r.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Payouts */}
        <Card title="Payout requests" action={<ViewAll href="/studio/earnings" />} flush>
          <div className="overflow-x-auto" data-lenis-prevent-horizontal>
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-y border-border bg-muted/50 text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-6 py-2.5 font-medium">Request</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Payout method</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Amount</th>
                  <th scope="col" className="px-6 py-2.5 text-right font-medium">Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {d.payouts.map((p) => (
                  <tr key={p.id} className="transition hover:bg-muted/40">
                    <td className="px-6 py-3 font-medium text-foreground">{p.id}</td>
                    <td className="px-3 py-3 text-muted-foreground">{p.method}</td>
                    <td className="px-3 py-3">
                      {p.status === "paid" ? (
                        <StatusBadge status="published" label="Paid" />
                      ) : (
                        <StatusBadge status="review" label="Processing" />
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-foreground tabular-nums">{money(p.amount)}</td>
                    <td className="px-6 py-3 text-right text-muted-foreground">{shortDate.format(new Date(p.date))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
  change?: number;
  note?: string;
}) {
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
        {change !== undefined ? (
          <>
            <span className="inline-flex items-center gap-0.5 rounded-md bg-brand/10 px-1.5 py-0.5 font-semibold text-brand-deep dark:text-brand">
              <TrendUpIcon className="size-3" />+{change}%
            </span>
            vs last month
          </>
        ) : (
          note
        )}
      </p>
    </li>
  );
}
