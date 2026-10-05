import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { getSiteSettings } from "@/lib/db/settings";
import { currencyName } from "@/lib/money";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms for using Ultimate Deejays: accounts, plans and payments, course content, challenges, the store and the affiliate program.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const { general, pricing } = await getSiteSettings();
  const email = general.supportEmail;
  return (
    <LegalPage
      title="Terms & Conditions"
      current="/terms"
      updated="2026-10-05"
      summary={
        <>
          The short version: create one account for yourself, pay once for a plan and keep it for life, use the lessons and downloads for your own
          learning and gigs, and treat other DJs with respect. The full terms are below.
        </>
      }
    >
      <section>
        <h2>1. Who we are</h2>
        <p>
          {general.siteName} (“we”, “us”) runs this website, an online school where working DJs teach mixing, scratching, production and performance.
          We are based in {general.address || "Kenya"}. By creating an account or using the site you agree to these terms.
        </p>
      </section>

      <section>
        <h2>2. Your account</h2>
        <ul>
          <li>You need an account to watch lessons, download files, enter challenges and buy a plan.</li>
          <li>Give accurate details, keep your password private, and don&apos;t share your account. One account is for one person.</li>
          <li>You must be at least 13 to create an account. If you are under 18, a parent or guardian should agree to these terms with you.</li>
          <li>You can delete your account at any time from Account → Settings.</li>
        </ul>
      </section>

      <section>
        <h2>3. Plans and payments</h2>
        <ul>
          <li>
            Prices are shown in {currencyName(general.currency)} and include any taxes we are required to charge. The Warm-Up plan is free; paid plans
            are a <strong>one-time payment</strong> with lifetime access to what the plan includes. Nothing renews automatically.
          </li>
          <li>Payments are processed by Paystack (card, M-Pesa and other methods). We never see or store your full card details.</li>
          {pricing.upgradeCredit && <li>When you upgrade, you only pay the difference between your current plan and the new one.</li>}
          <li>Discount codes have their own conditions (dates, plans, number of uses) and can&apos;t be exchanged for cash.</li>
          <li>
            Refunds are covered by our <Link href="/refunds">Refund Policy</Link>.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Courses and downloads</h2>
        <ul>
          <li>Lessons, practice tracks, templates and other files are for your own learning and performances.</li>
          <li>Please don&apos;t re-upload, resell or share lesson videos or paid downloads, or record and redistribute them.</li>
          <li>
            Some downloads come with their own licence (for example, practice tracks you may use in your mixes). Where a file says so, its licence
            applies.
          </li>
          <li>We regularly improve courses and may update, reorganise or retire lessons. Your plan keeps access to the courses it includes.</li>
        </ul>
      </section>

      <section>
        <h2>5. Challenges, reviews and mixes</h2>
        <ul>
          <li>When you enter a challenge, submit a mix or write a review, you confirm the work is yours and that you have the right to share it.</li>
          <li>You keep ownership of your mixes. You give us permission to show your entry or review on the site and in our promotion of the challenge.</li>
          <li>We may remove content that is offensive, infringes someone else&apos;s rights, or breaks a challenge&apos;s rules.</li>
        </ul>
      </section>

      <section>
        <h2>6. Affiliate program</h2>
        <p>
          Affiliates earn commission on purchases made with their link or code, under the terms shown in the affiliate dashboard. You may not use your
          own code, spam, or mislead people about the site. We may pause an affiliate account that breaks these rules and withhold commission earned
          that way.
        </p>
      </section>

      <section>
        <h2>7. Acceptable use</h2>
        <p>Please don&apos;t try to break, overload or get around the site&apos;s security, scrape content, or use the site for anything unlawful.</p>
      </section>

      <section>
        <h2>8. Our responsibility</h2>
        <p>
          We work hard to keep the site available and the teaching accurate, but we can&apos;t promise it will always be uninterrupted or error-free, or
          that following a course will lead to bookings. As far as the law allows, our liability to you is limited to the amount you paid us in the
          past 12 months. Nothing in these terms limits rights you have under Kenyan consumer protection law.
        </p>
      </section>

      <section>
        <h2>9. Suspending accounts</h2>
        <p>
          We may suspend or close an account that seriously or repeatedly breaks these terms. If we close your account without good reason, we will
          refund you for the paid plan.
        </p>
      </section>

      <section>
        <h2>10. Changes and law</h2>
        <p>
          We may update these terms; when we make important changes we&apos;ll tell you by email or on the site before they apply. These terms are
          governed by the laws of Kenya.
        </p>
      </section>

      <section>
        <h2>11. Contact</h2>
        <p>
          Questions about these terms? Email <a href={`mailto:${email}`}>{email}</a> or see our <Link href="/contact">contact page</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
