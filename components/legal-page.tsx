import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "./page-header";

const updatedFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const policies = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refunds", label: "Refund Policy" },
  { href: "/cookies", label: "Cookie Policy" },
];

/*
 * The layout for the policy pages (terms, privacy, refunds, cookies): the
 * page title band, a short summary, the text, and links to the other
 * policies. Children are plain <section>s with <h2>, <p> and <ul>; the
 * typography is applied here so each page stays simple to edit.
 */
export function LegalPage({ title, updated, summary, current, children }: { title: string; updated: string; summary: ReactNode; current: string; children: ReactNode }) {
  return (
    <main className="flex-1">
      <PageHeader title={title} />
      <div className="site-container grid gap-10 pb-20 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16 lg:pb-28">
        <article className="max-w-3xl min-w-0">
          <p className="text-sm text-muted-foreground">Last updated {updatedFormat.format(new Date(updated))}</p>
          <div className="mt-4 rounded-2xl border border-brand/20 bg-brand/[0.06] p-5 text-[0.9375rem] leading-relaxed text-foreground">{summary}</div>
          <div className="mt-10 space-y-10 text-[0.9375rem] leading-relaxed text-foreground/85 [&_a]:font-medium [&_a]:text-brand [&_a]:hover:underline [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_li]:pl-1 [&_p]:mt-3 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
            {children}
          </div>
        </article>
        <aside aria-label="Our policies" className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-sm font-semibold text-foreground">Our policies</p>
          <ul className="mt-3 space-y-1">
            {policies.map((p) => (
              <li key={p.href}>
                <Link
                  href={p.href}
                  aria-current={p.href === current ? "page" : undefined}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${p.href === current ? "bg-brand/10 font-medium text-brand-deep dark:text-brand" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}`}
                >
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            Questions? <Link href="/contact" className="font-medium text-brand hover:underline">Contact us</Link>.
          </p>
        </aside>
      </div>
    </main>
  );
}
