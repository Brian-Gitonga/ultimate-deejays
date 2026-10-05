import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { getSiteSettings } from "@/lib/db/settings";
import { whatsappHref } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "How refunds work at Ultimate Deejays: the money-back guarantee on paid plans, how to ask, and how long it takes.",
  alternates: { canonical: "/refunds" },
};

export default async function RefundsPage() {
  const { general, pricing } = await getSiteSettings();
  const email = general.supportEmail;
  const days = pricing.guaranteeDays;
  const whatsapp = whatsappHref(general.phone, "Hi Ultimate Deejays, I'd like to ask about a refund.");
  return (
    <LegalPage
      title="Refund Policy"
      current="/refunds"
      updated="2026-10-05"
      summary={
        days > 0 ? (
          <>
            Every paid plan has a <strong>{days}-day money-back guarantee</strong>. If it&apos;s not for you, ask within {days} days of paying and we&apos;ll
            refund you in full. No awkward questions.
          </>
        ) : (
          <>If something went wrong with your purchase, contact us and we&apos;ll put it right.</>
        )
      }
    >
      {days > 0 && (
        <section>
          <h2>1. The {days}-day guarantee</h2>
          <ul>
            <li>It applies to every paid plan and every upgrade, counted from the day you paid.</li>
            <li>You get back the full amount you paid for that order, including when you used a discount code (you get back what you actually paid).</li>
            <li>We may ask why, only so we can improve. Your answer doesn&apos;t affect the refund.</li>
          </ul>
        </section>
      )}

      <section>
        <h2>{days > 0 ? "2" : "1"}. How to ask for a refund</h2>
        <p>
          Email <a href={`mailto:${email}`}>{email}</a>
          {whatsapp && (
            <>
              {" "}
              or{" "}
              <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                message us on WhatsApp
              </a>
            </>
          )}{" "}
          from the email address on your account, with your order number. You can find it in Account → Billing, and in your payment confirmation.
        </p>
      </section>

      <section>
        <h2>{days > 0 ? "3" : "2"}. How long it takes</h2>
        <p>
          We process refunds within 3 working days. The money goes back the way you paid, through Paystack: M-Pesa refunds usually arrive within a few
          days, and card refunds can take 5 to 10 working days to show, depending on your bank.
        </p>
      </section>

      <section>
        <h2>{days > 0 ? "4" : "3"}. What happens to your access</h2>
        <p>
          When a plan is refunded, your account goes back to the plan you had before (usually the free Warm-Up plan). Your progress and notes stay, so
          you can pick up again if you come back.
        </p>
      </section>

      <section>
        <h2>{days > 0 ? "5" : "4"}. After {days > 0 ? `${days} days` : "that"}</h2>
        <p>
          {days > 0 ? `After ${days} days, purchases aren't usually refundable, ` : "Purchases aren't usually refundable, "}
          but we will always refund you if you were charged twice, charged the wrong amount, or couldn&apos;t access what you paid for because of a
          problem on our side.
        </p>
      </section>

      <section>
        <h2>{days > 0 ? "6" : "5"}. Free plans and downloads</h2>
        <p>
          The Warm-Up plan and free downloads cost nothing, so there&apos;s nothing to refund. See also our <Link href="/terms">Terms &amp; Conditions</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
