import "server-only";
import { getSiteSettings } from "@/lib/db/settings";
import type { Viewer } from "@/lib/dal";
import { readReferralVisit } from "@/lib/referrals.server";
import type { Tables } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { discountOf, formatMoney, isAbove, normalizeCode, type AppliedCode, type PaidPlan, type Quote } from "./checkout";

/*
 * Prices an order: the plan, upgrade credit, one discount code and the
 * affiliate who gets the commission. Runs on the server for the checkout
 * page and again when the order is placed, so the browser never decides a
 * price. Reads coupons and affiliates with the secret key (buyers can't read
 * those tables).
 *
 * Who earns the commission (one affiliate per order):
 *   1. an affiliate code typed at checkout
 *   2. the last affiliate link they clicked, within the cookie length
 *   3. the affiliate they signed up through, within the cookie length
 * Never the buyer themselves, and only approved affiliates.
 *
 * The discount (one code per order): a code typed at checkout (promo or
 * affiliate). Otherwise, if an affiliate referred them, that affiliate's code
 * is applied automatically, so links and codes give the same deal.
 */

type Affiliate = { userId: string; code: string; name: string; commission: number; customerDiscount: number | null };

export type PricedOrder = {
  quote: Quote;
  /** Saved on the checkout row; never sent to the browser. */
  order: { couponId: string | null; couponCode: string; affiliateId: string | null; commissionRate: number; refSub: string };
};

export type PriceResult = { ok: true; priced: PricedOrder } | { ok: false; reason: "admin" | "owned" | "unavailable"; error: string };

const DAY = 86_400_000;

async function findAffiliate(admin: ReturnType<typeof createAdminClient>, match: { code: string } | { userId: string }): Promise<Affiliate | null> {
  let query = admin
    .from("affiliate_applications")
    .select("user_id, code, status, commission, customer_discount, profile:profiles!affiliate_applications_user_id_fkey(dj_name, full_name)")
    .eq("status", "approved");
  query = "code" in match ? query.eq("code", match.code) : query.eq("user_id", match.userId);
  const { data, error } = await query.maybeSingle();
  if (error) console.error("[checkout] affiliate lookup", error.message);
  if (!data?.code) return null;
  return {
    userId: data.user_id,
    code: data.code,
    name: data.profile?.dj_name || data.profile?.full_name || data.code,
    commission: data.commission,
    customerDiscount: data.customer_discount,
  };
}

async function couponProblem(admin: ReturnType<typeof createAdminClient>, coupon: Tables<"coupons">, plan: PaidPlan, planName: string, buyerId: string) {
  const now = Date.now();
  if (!coupon.active) return "That code has been switched off.";
  if (coupon.starts_at && Date.parse(coupon.starts_at) > now) return "That code isn't active yet.";
  if (coupon.expires_at && Date.parse(coupon.expires_at) <= now) return "That code has expired.";
  if (coupon.max_redemptions !== null && coupon.redemptions >= coupon.max_redemptions) return "That code has been fully used.";
  if (coupon.plans.length && !coupon.plans.includes(plan)) return `That code doesn't apply to the ${planName} plan.`;
  if (coupon.once_per_customer) {
    const { count } = await admin.from("checkouts").select("id", { count: "exact", head: true }).eq("user_id", buyerId).eq("coupon_id", coupon.id).eq("status", "paid");
    if (count) return "You've already used that code.";
  }
  return null;
}

export async function priceOrder(viewer: Viewer, plan: PaidPlan, typedCode: string): Promise<PriceResult> {
  const settings = await getSiteSettings();
  const currency = settings.general.currency;
  const target = settings.plans.find((p) => p.slug === plan);
  if (!target || target.price <= 0) return { ok: false, reason: "unavailable", error: "That plan isn't for sale right now." };
  if (viewer.role === "admin") return { ok: false, reason: "admin", error: "Admins already have every course." };
  if (!isAbove(plan, viewer.plan)) return { ok: false, reason: "owned", error: `Your plan already includes everything in ${target.name}.` };

  const current = settings.plans.find((p) => p.slug === viewer.plan);
  const kind = viewer.plan === "warm-up" ? "purchase" : "upgrade";
  const credit = kind === "upgrade" && settings.pricing.upgradeCredit ? Math.min(current?.price ?? 0, target.price) : 0;
  const base = Math.round((target.price - credit) * 100) / 100;

  const admin = createAdminClient();
  const program = settings.affiliates;
  const windowMs = program.cookieDays * DAY;
  const code = normalizeCode(typedCode);

  let applied: AppliedCode | null = null;
  let discount = 0;
  let codeError: string | null = null;
  let couponId: string | null = null;
  let affiliate: Affiliate | null = null;
  let refSub = "";

  const affiliateDeal = (a: Affiliate) => a.customerDiscount ?? program.customerDiscount;

  // 1. A code typed at checkout.
  if (code) {
    const { data: coupon } = await admin.from("coupons").select("*").eq("code", code).maybeSingle();
    if (coupon) {
      codeError = await couponProblem(admin, coupon, plan, target.name, viewer.id);
      if (!codeError) {
        couponId = coupon.id;
        discount = discountOf(base, coupon.discount_type as "percent" | "fixed", Number(coupon.discount_value));
        const label = coupon.discount_type === "percent" ? `${Number(coupon.discount_value)}% off` : `${formatMoney(Number(coupon.discount_value), currency)} off`;
        applied = { code, kind: "coupon", label, automatic: false };
      }
    } else {
      const typed = await findAffiliate(admin, { code });
      if (!typed) codeError = "That code isn't valid. Check the spelling and try again.";
      else if (typed.userId === viewer.id) codeError = "That's your own referral code: share it with others instead.";
      else {
        affiliate = typed;
        const percent = affiliateDeal(typed);
        discount = discountOf(base, "percent", percent);
        applied = { code, kind: "affiliate", label: percent ? `${percent}% off` : "Referral code", automatic: false };
      }
    }
  }

  // 2. The last affiliate link they clicked, within the cookie length.
  if (!affiliate) {
    const visit = await readReferralVisit();
    if (visit && visit.at && Date.now() - visit.at <= windowMs) {
      const linked = await findAffiliate(admin, { code: visit.code });
      if (linked && linked.userId !== viewer.id) {
        affiliate = linked;
        refSub = visit.sub;
      }
    }
  }

  // 3. The affiliate they signed up through, within the cookie length.
  if (!affiliate) {
    const { data: me } = await admin.from("profiles").select("referred_by, referred_at").eq("id", viewer.id).maybeSingle();
    if (me?.referred_by && me.referred_at && Date.now() - Date.parse(me.referred_at) <= windowMs) {
      const referrer = await findAffiliate(admin, { userId: me.referred_by });
      if (referrer && referrer.userId !== viewer.id) affiliate = referrer;
    }
  }

  // A referred buyer who didn't type a working code gets their affiliate's deal.
  if (!applied && affiliate && affiliateDeal(affiliate) > 0) {
    const percent = affiliateDeal(affiliate);
    discount = discountOf(base, "percent", percent);
    applied = { code: affiliate.code, kind: "affiliate", label: `${percent}% off`, automatic: true };
  }

  const total = Math.round((base - discount) * 100) / 100;
  return {
    ok: true,
    priced: {
      quote: {
        plan,
        planName: target.name,
        kind,
        currency,
        price: target.price,
        credit,
        discount,
        total,
        code: applied,
        codeError,
        referredBy: affiliate?.name ?? null,
      },
      order: {
        couponId,
        couponCode: applied?.code ?? "",
        affiliateId: affiliate?.userId ?? null,
        commissionRate: affiliate?.commission ?? 0,
        refSub,
      },
    },
  };
}

/** A unique order reference, also Paystack's transaction reference: "UD-LZ4K2M-8F3A". */
export function newReference() {
  const random = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().padStart(6, "0");
  return `UD-${Date.now().toString(36).toUpperCase()}-${random}`;
}

/** Thrown when Paystack confirms a different amount than the order's total. */
export class AmountMismatchError extends Error {}

/**
 * Turns a confirmed payment into a payment row (idempotent). Returns the
 * payment id. A wrong amount marks the order failed (fulfill_checkout's own
 * update is undone with its error) and throws AmountMismatchError.
 */
export async function fulfillOrder(input: {
  reference: string;
  amount: number;
  fee: number;
  method: "card" | "paypal" | "mobile_money" | "bank_transfer" | "free";
  source: string;
  country: string;
  paidAt: string | null;
}) {
  const { data, error } = await createAdminClient().rpc("fulfill_checkout", {
    checkout_reference: input.reference,
    paid_amount: input.amount,
    paid_fee: input.fee,
    paid_method: input.method,
    paid_source: input.source.slice(0, 120),
    paid_country: input.country.slice(0, 80),
    paid_at: input.paidAt ?? new Date().toISOString(),
  });
  if (error) {
    if (/does not match/.test(error.message)) {
      await createAdminClient()
        .from("checkouts")
        .update({ status: "failed", failure: `Paid ${input.amount}, but the order total was different. Check it in Paystack.` })
        .eq("reference", input.reference);
      throw new AmountMismatchError(error.message);
    }
    throw new Error(`fulfill_checkout(${input.reference}) failed: ${error.message}`);
  }
  return data;
}
