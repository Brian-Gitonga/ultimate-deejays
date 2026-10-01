import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { InstagramIcon, TiktokIcon, XIcon, YoutubeIcon } from "./icons";
import { Logo } from "./logo";

const socials: { label: string; href: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { label: "Instagram", href: "https://www.instagram.com/", icon: InstagramIcon },
  { label: "TikTok", href: "https://www.tiktok.com/", icon: TiktokIcon },
  { label: "YouTube", href: "https://www.youtube.com/", icon: YoutubeIcon },
  { label: "X", href: "https://x.com/", icon: XIcon },
];

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Instructors", href: "/about#team" },
      { label: "Affiliate Program", href: "/affiliate" },
      { label: "Careers", href: "/careers" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "Legal & Policies",
    links: [
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Refund Policy", href: "/refunds" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-cream">
      <div className="site-container pt-14 lg:pt-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Logo />
            <p className="mt-5 max-w-[25rem] text-[0.9375rem] leading-relaxed text-muted-foreground">
              Ultimate Deejays is an online DJ school where working DJs teach you to mix, scratch, produce and play
              your first gigs, at your own pace, from anywhere.
            </p>

            <ul className="mt-6 flex gap-3">
              {socials.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Ultimate Deejays on ${label}`}
                    className="flex size-10 items-center justify-center rounded-full bg-foreground/[0.06] text-foreground/70 transition hover:bg-brand hover:text-white"
                  >
                    <Icon className="size-[1.125rem]" />
                  </a>
                </li>
              ))}
            </ul>

            <p className="mt-10 text-base font-medium text-foreground">We support multiple payment methods.</p>
            <PaymentMethods />
          </div>

          <div className="grid gap-10 sm:grid-cols-[0.8fr_1fr_1.3fr] lg:col-span-7 lg:pl-10">
            {columns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="text-lg font-semibold text-foreground">{column.title}</h2>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-[0.9375rem] text-muted-foreground transition hover:text-brand">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            <div>
              <h2 className="text-lg font-semibold text-foreground">Get in Touch</h2>
              <address className="mt-4 space-y-3 text-[0.9375rem] leading-relaxed text-muted-foreground not-italic">
                <p>
                  Studio 7, Soundwave House
                  <br />
                  Los Angeles, CA
                </p>
                <p>
                  Email:{" "}
                  <a href="mailto:hello@ultimatedeejays.com" className="transition hover:text-brand">
                    hello@ultimatedeejays.com
                  </a>
                </p>
                <p>
                  Phone:{" "}
                  <a href="tel:+13105550142" className="transition hover:text-brand">
                    +1 (310) 555-0142
                  </a>
                </p>
              </address>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-border py-7 text-center text-sm text-muted-foreground lg:mt-16">
          © {new Date().getFullYear()} Ultimate Deejays. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

/* Simplified wordmarks for the accepted payment methods. */
function PaymentMethods() {
  return (
    <ul aria-label="Accepted payment methods" className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-4">
      <li>
        <span className="sr-only">Stripe</span>
        <span aria-hidden="true" className="text-[1.4375rem] font-bold tracking-[-0.06em] text-[#635bff] dark:text-[#9690ff]">
          stripe
        </span>
      </li>
      <li className="flex items-center gap-1">
        <span className="sr-only">PayPal</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6">
          <path
            fill="#003087"
            d="M7.02 19.2h-4.2a.56.56 0 0 1-.56-.65L5.1.58A.69.69 0 0 1 5.78 0H13c3.42 0 5.9 2.49 5.85 5.5a6.8 6.8 0 0 1-6.77 6.5H8.74a.69.69 0 0 0-.68.58l-.33 2.06-.7 4.47Z"
            className="dark:fill-[#6c9bd2]"
          />
          <path
            fill="#009cde"
            d="M19.79 6.14a7.76 7.76 0 0 1-7.72 6.86H9l-.28 1.8-.84 5.4H6.86l-.5 3.15a.56.56 0 0 0 .56.65h3.94c.34 0 .63-.25.68-.59l.95-6.03a.69.69 0 0 1 .69-.58h2.64a6.8 6.8 0 0 0 6.71-5.76c.31-1.87-.28-3.63-1.74-4.9Z"
          />
        </svg>
        <span aria-hidden="true" className="text-[1.3125rem] font-extrabold tracking-tight italic">
          <span className="text-[#003087] dark:text-[#6c9bd2]">Pay</span>
          <span className="text-[#009cde]">Pal</span>
        </span>
      </li>
      <li>
        <span className="sr-only">Visa</span>
        <span aria-hidden="true" className="text-[1.5rem] font-black tracking-tight text-[#1a1f71] italic dark:text-white">
          VISA
        </span>
      </li>
      <li className="flex items-center gap-1.5">
        <span className="sr-only">Mastercard</span>
        <svg aria-hidden="true" viewBox="0 0 38 24" className="h-7 w-auto">
          <circle cx="13" cy="12" r="10" fill="#eb001b" />
          <circle cx="25" cy="12" r="10" fill="#f79e1b" />
          <path fill="#ff5f00" d="M19 4a10 10 0 0 1 0 16 10 10 0 0 1 0-16Z" />
        </svg>
        <span aria-hidden="true" className="text-[0.9375rem] font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">
          mastercard
        </span>
      </li>
    </ul>
  );
}
