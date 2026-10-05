import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon, MailIcon, PhoneIcon, PinIcon, WhatsappIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { telHref, whatsappHref } from "@/lib/contact";
import { getSiteSettings } from "@/lib/db/settings";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Ultimate Deejays on WhatsApp, by phone or by email. Questions about courses, plans, payments or partnerships.",
  alternates: { canonical: "/contact" },
};

const card = "flex flex-col rounded-2xl border border-black/[0.06] bg-card p-6 shadow-[0_8px_30px_-6px_rgb(0_0_0/0.06)] dark:border-white/10";

/* How to reach us. Every detail comes from Studio → Settings → General → Contact. */
export default async function ContactPage() {
  const { general } = await getSiteSettings();
  const whatsapp = whatsappHref(general.phone);
  const tel = telHref(general.phone);

  return (
    <main className="flex-1">
      <PageHeader title="Contact Us" />
      <div className="site-container pb-20 lg:pb-28">
        <p className="mx-auto max-w-2xl text-center text-base text-pretty text-muted-foreground sm:text-[1.0625rem]">
          Questions about a course, your plan or a payment? Want to partner with us? Message us. A real DJ on our team will reply, usually the same day.
        </p>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {whatsapp && (
            <li className={`${card} border-[#25d366]/40 sm:col-span-2 lg:col-span-1`}>
              <Badge className="bg-[#25d366] text-neutral-900">
                <WhatsappIcon className="size-6" />
              </Badge>
              <h2 className="mt-5 text-lg font-semibold text-foreground">WhatsApp</h2>
              <p className="mt-1 text-sm text-muted-foreground">The fastest way to reach us.</p>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#25d366] px-5 text-sm font-semibold text-neutral-900 transition hover:brightness-95"
              >
                Chat on WhatsApp <ArrowRightIcon className="size-4" />
              </a>
            </li>
          )}
          {tel && (
            <li className={card}>
              <Badge>
                <PhoneIcon className="size-5" />
              </Badge>
              <h2 className="mt-5 text-lg font-semibold text-foreground">Phone</h2>
              <p className="mt-1 text-sm text-muted-foreground">Mon–Sat, 9am to 6pm (EAT).</p>
              <a href={tel} className="mt-5 text-base font-semibold text-brand hover:underline">
                {general.phone}
              </a>
            </li>
          )}
          <li className={card}>
            <Badge>
              <MailIcon className="size-5" />
            </Badge>
            <h2 className="mt-5 text-lg font-semibold text-foreground">Email</h2>
            <p className="mt-1 text-sm text-muted-foreground">For receipts, refunds and partnerships.</p>
            <a href={`mailto:${general.supportEmail}`} className="mt-5 text-base font-semibold break-all text-brand hover:underline">
              {general.supportEmail}
            </a>
          </li>
        </ul>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_2fr]">
          {general.address && (
            <div className={card}>
              <Badge>
                <PinIcon className="size-5" />
              </Badge>
              <h2 className="mt-5 text-lg font-semibold text-foreground">Where we are</h2>
              <p className="mt-1 text-base text-foreground/85">{general.address}</p>
              <p className="mt-2 text-sm text-muted-foreground">We teach online, so you can learn from anywhere.</p>
            </div>
          )}
          <div className={card}>
            <h2 className="text-lg font-semibold text-foreground">Before you write</h2>
            <ul className="mt-3 space-y-3 text-[0.9375rem] text-muted-foreground">
              <Help href="/pricing">Which plan is right for me, and how do upgrades work?</Help>
              <Help href="/refunds">How do I get a refund?</Help>
              <Help href="/account/billing">Where is my receipt or order number?</Help>
              <Help href="/account/affiliate">How do I become an affiliate?</Help>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

function Badge({ children, className = "bg-brand/10 text-brand" }: { children: ReactNode; className?: string }) {
  return <span className={`flex size-12 items-center justify-center rounded-xl ${className}`}>{children}</span>;
}

function Help({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <Link href={href} className="group inline-flex items-start gap-2 hover:text-foreground">
        <ArrowRightIcon className="mt-1 size-4 shrink-0 text-brand transition-transform group-hover:translate-x-0.5" />
        {children}
      </Link>
    </li>
  );
}
