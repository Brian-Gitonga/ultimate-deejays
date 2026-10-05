import type { Metadata } from "next";
import type { ComponentType, SVGProps } from "react";
import { ArrowRightIcon, HandshakeIcon, MicIcon, PencilIcon, WhatsappIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { whatsappHref } from "@/lib/contact";
import { getSiteSettings } from "@/lib/db/settings";

export const metadata: Metadata = {
  title: "Careers: Teach with us",
  description: "Teach DJing with Ultimate Deejays. We're looking for working DJs, producers and creators across Africa to teach and create with us.",
  alternates: { canonical: "/careers" },
};

const ways: { icon: ComponentType<SVGProps<SVGSVGElement>>; title: string; text: string }[] = [
  { icon: MicIcon, title: "Teach a course", text: "You play out every week and know a style inside out: amapiano, afrobeats, gengetone, house, hip-hop, open format or weddings." },
  { icon: PencilIcon, title: "Write and create", text: "Blog posts, cue sheets, practice packs and templates for the Store, from people who use them on real gigs." },
  { icon: HandshakeIcon, title: "Partner with us", text: "Venues, gear shops, events and creators who want to work with a growing community of new DJs." },
];

/* There are no open job listings yet, so this page invites DJs to pitch. */
export default async function CareersPage() {
  const { general } = await getSiteSettings();
  const whatsapp = whatsappHref(general.phone, "Hi Ultimate Deejays, I'd like to teach with you. Here's a link to my mixes:");
  const subject = encodeURIComponent("Teaching with Ultimate Deejays");
  return (
    <main className="flex-1">
      <PageHeader title="Teach with us" />
      <div className="site-container pb-20 lg:pb-28">
        <p className="mx-auto max-w-2xl text-center text-base text-pretty text-muted-foreground sm:text-[1.0625rem]">
          We&apos;re a young school built by working DJs, and we&apos;re growing our team of instructors across Kenya and Africa. We don&apos;t have open
          job listings right now, but we&apos;d love to hear from you.
        </p>

        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {ways.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-2xl border border-black/[0.06] bg-card p-6 shadow-[0_8px_30px_-6px_rgb(0_0_0/0.06)] dark:border-white/10">
              <span className="flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>

        <section aria-labelledby="pitch-title" className="mx-auto mt-14 max-w-2xl rounded-3xl bg-brand-deep px-6 py-10 text-center text-white sm:px-10">
          <h2 id="pitch-title" className="text-2xl font-bold tracking-tight">
            Send us your pitch
          </h2>
          <p className="mt-3 text-white/85">Tell us who you are, where you play, and what you&apos;d teach. Include a link to a recent mix or a video of you behind the decks.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25d366] px-6 text-sm font-semibold text-neutral-900 transition hover:brightness-95"
              >
                <WhatsappIcon className="size-5" /> Pitch on WhatsApp
              </a>
            )}
            <a
              href={`mailto:${general.supportEmail}?subject=${subject}`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-neutral-900 transition hover:bg-white/90"
            >
              Email us <ArrowRightIcon className="size-4" />
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
