import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { getSiteSettings } from "@/lib/db/settings";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What personal data Ultimate Deejays collects, why, who we share it with, and your rights under Kenya's Data Protection Act.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const { general } = await getSiteSettings();
  const email = general.supportEmail;
  return (
    <LegalPage
      title="Privacy Policy"
      current="/privacy"
      updated="2026-10-05"
      summary={
        <>
          We collect what we need to run your account, teach you and take payments, and nothing more. We don&apos;t sell your data. You can see,
          correct or delete it at any time.
        </>
      }
    >
      <section>
        <h2>1. Who is responsible</h2>
        <p>
          {general.siteName}, based in {general.address || "Kenya"}, is responsible for your personal data on this site. We handle it in line with
          Kenya&apos;s Data Protection Act, 2019. Contact us about privacy at <a href={`mailto:${email}`}>{email}</a>.
        </p>
      </section>

      <section>
        <h2>2. What we collect</h2>
        <ul>
          <li>
            <strong>Account details:</strong> your name, email address, password (stored encrypted), and anything you add to your profile, such as a DJ
            name, photo or location. If you sign in with Google, we receive your name, email and photo from Google.
          </li>
          <li>
            <strong>Learning activity:</strong> the courses you open, lessons you complete, notes, reviews, challenge entries, mixes you submit and files
            you download.
          </li>
          <li>
            <strong>Payments:</strong> what you bought, the amount, the date and the payment method type (for example “M-Pesa” or the last four digits of a
            card). Paystack processes the payment itself; we never receive your full card number or M-Pesa PIN.
          </li>
          <li>
            <strong>Referrals:</strong> if you arrive through an affiliate&apos;s link, which affiliate referred you, so they can be credited.
          </li>
          <li>
            <strong>Messages:</strong> emails and WhatsApp messages you send us, and your newsletter subscription.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Why we use it</h2>
        <ul>
          <li>To run your account and give you the courses and downloads your plan includes.</li>
          <li>To take payments, send receipts and handle refunds.</li>
          <li>To save your progress across devices and show you where you left off.</li>
          <li>To pay affiliates their commission.</li>
          <li>To answer your questions and, if you agreed, send the emails you chose in Account → Settings.</li>
          <li>To keep the site secure and prevent fraud.</li>
        </ul>
      </section>

      <section>
        <h2>4. Who we share it with</h2>
        <p>We don&apos;t sell your data. We only share it with the services that help us run the site:</p>
        <ul>
          <li>
            <strong>Supabase</strong>, which hosts our database, sign-in and file storage.
          </li>
          <li>
            <strong>Paystack</strong>, which processes payments.
          </li>
          <li>
            <strong>YouTube</strong>, which plays lesson videos. When you play a video, YouTube may set its own cookies.
          </li>
          <li>
            <strong>Affiliates</strong> see only the first name and last initial of people they referred who bought a plan, never contact or payment
            details.
          </li>
        </ul>
        <p>Some of these services store data outside Kenya. We use providers that protect it to a standard comparable to Kenyan law.</p>
      </section>

      <section>
        <h2>5. How long we keep it</h2>
        <p>
          We keep your account data while your account exists. When you delete your account, we delete your profile, progress, notes and submissions.
          We keep payment records, without your name attached, for as long as tax law requires.
        </p>
      </section>

      <section>
        <h2>6. Your rights</h2>
        <p>Under the Data Protection Act you can:</p>
        <ul>
          <li>see the personal data we hold about you, and get a copy;</li>
          <li>correct it (most of it you can edit yourself in your account);</li>
          <li>delete it, by deleting your account in Account → Settings or by asking us;</li>
          <li>object to marketing, by turning emails off in Account → Settings or unsubscribing from any email;</li>
          <li>complain to the Office of the Data Protection Commissioner if you think we handled your data wrongly.</li>
        </ul>
        <p>
          To use any of these rights, email <a href={`mailto:${email}`}>{email}</a>. We reply within 7 days.
        </p>
      </section>

      <section>
        <h2>7. Cookies</h2>
        <p>
          We use a small number of cookies and similar storage to keep you signed in and remember your settings. See the{" "}
          <Link href="/cookies">Cookie Policy</Link> for the full list.
        </p>
      </section>

      <section>
        <h2>8. Children</h2>
        <p>Accounts are for people aged 13 and over. If you believe a child under 13 has created an account, contact us and we will delete it.</p>
      </section>

      <section>
        <h2>9. Changes</h2>
        <p>If we change how we use your data in an important way, we&apos;ll tell you by email or on the site first.</p>
      </section>
    </LegalPage>
  );
}
