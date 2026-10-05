import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { getSiteSettings } from "@/lib/db/settings";
import { REFERRAL_COOKIE } from "@/lib/referrals";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "The cookies and browser storage Ultimate Deejays uses, what each one is for, and how to clear them.",
  alternates: { canonical: "/cookies" },
};

export default async function CookiesPage() {
  const { affiliates } = await getSiteSettings();
  const rows = [
    { name: "Sign-in (sb-…-auth-token)", type: "Cookie", purpose: "Keeps you signed in to your account.", lasts: "Until you log out" },
    {
      name: REFERRAL_COOKIE,
      type: "Cookie",
      purpose: "Remembers which affiliate's link brought you here, so they're credited if you buy a plan.",
      lasts: `${affiliates.cookieDays} days`,
    },
    { name: "theme", type: "Browser storage", purpose: "Remembers whether you chose light or dark mode.", lasts: "Until you clear it" },
    { name: "ud:progress:…", type: "Browser storage", purpose: "Saves your lesson progress and notes on this device.", lasts: "Until you clear it" },
    { name: "…-sidebar-collapsed", type: "Browser storage", purpose: "Remembers if you collapsed a dashboard sidebar.", lasts: "Until you clear it" },
  ];
  return (
    <LegalPage
      title="Cookie Policy"
      current="/cookies"
      updated="2026-10-05"
      summary={
        <>
          We only use cookies that make the site work: keeping you signed in, crediting affiliates, and remembering your settings.{" "}
          <strong>No advertising or tracking cookies.</strong>
        </>
      }
    >
      <section>
        <h2>1. What we use</h2>
        <p>Cookies and browser storage are small pieces of information saved by your browser. Here is everything this site saves:</p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Name</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Type</th>
                <th scope="col" className="px-4 py-2.5 font-medium">What it&apos;s for</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Lasts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.name}>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{r.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.type}</td>
                  <td className="px-4 py-3">{r.purpose}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.lasts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>2. Other services</h2>
        <ul>
          <li>
            <strong>YouTube:</strong> lesson videos play from YouTube, which may set its own cookies once you press play. Videos aren&apos;t loaded until
            you do.
          </li>
          <li>
            <strong>Paystack:</strong> when you pay, Paystack&apos;s secure payment page may use its own cookies to process the payment and prevent fraud.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Your choices</h2>
        <p>
          Because these cookies are needed for the site to work, we don&apos;t ask you to accept them. You can delete them at any time in your browser
          settings. You&apos;ll be logged out, and your device-only settings will reset. Progress on courses you&apos;re taking is also saved to your
          account, so you won&apos;t lose it.
        </p>
        <p>
          More about how we handle your data: <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
