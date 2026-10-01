import { getAffiliateApplications, type Affiliate } from "./affiliates";
import { plans, type Plan } from "./plans";
import { getStudents } from "./students";

/*
 * Platform earnings. PLACEHOLDER: generated sample payments, deterministic so
 * they're identical on every load, sized to match the dashboard's monthly
 * revenue. With a backend these come from your payment provider's webhooks
 * (Stripe / PayPal) and getTransactions() becomes a database query.
 */

export type PaymentMethod = "card" | "paypal";
export type TransactionStatus = "paid" | "refunded";

export type Transaction = {
  id: string;
  customer: string;
  email: string;
  avatar: string | null;
  country: string;
  plan: Plan["slug"];
  /** "upgrade" = paid the difference to move up a plan */
  kind: "purchase" | "upgrade";
  amount: number;
  fee: number;
  method: PaymentMethod;
  /** Card brand + last digits, or the PayPal account */
  source: string;
  status: TransactionStatus;
  date: string;
  refundedAt: string | null;
  /** Referral code of the affiliate who referred the sale, if any */
  affiliate: string | null;
  commission: number;
  updatedAt: string;
};

export type Payout = { id: string; amount: number; destination: string; status: "paid" | "in-transit"; date: string; period: string };

// Card: 2.9% + $0.30; PayPal: 3.49% + $0.49.
export const processingFee = (amount: number, method: PaymentMethod) =>
  Math.round((method === "card" ? amount * 0.029 + 0.3 : amount * 0.0349 + 0.49) * 100) / 100;

const round = (n: number) => Math.round(n * 100) / 100;

/** What we keep from a payment after fees, affiliate commission and refunds. */
export const netOf = (t: Pick<Transaction, "amount" | "fee" | "commission" | "status">) =>
  t.status === "refunded" ? -t.fee : round(t.amount - t.fee - t.commission);

// Monthly gross for Jan–Sep 2026; kept in step with the dashboard chart.
const monthlyTargets = [2140, 2380, 2910, 2650, 3420, 3180, 3960, 4510, 4870];

const firstNames = ["Amani", "Lena", "Kofi", "Ravi", "Sam", "Jordan", "Sofía", "Yuki", "Thandi", "Lucas", "Chloé", "Ethan", "Aisha", "Mateo", "Hana", "Noah", "Zara", "Diego", "Grace", "Oliver", "Priya", "Marcus", "Nia", "Tomás", "Emma", "Kwame", "Isabella", "Liam", "Fatima", "Jonas", "Maya", "Tariq", "Elena", "Brian", "Wanjiru", "Mei"];
const lastNames = ["Otieno", "Müller", "Asante", "Patel", "Okafor", "Blake", "Ramírez", "Sato", "Nkosi", "Oliveira", "Martin", "Brooks", "Bello", "Rossi", "Kim", "Williams", "Ahmed", "Fernández", "Wanjiku", "Jensen", "Sharma", "Johnson", "Kamau", "Silva", "Novak", "Mensah", "Costa", "O'Connor", "Hassan", "Berg"];
const countries = ["Kenya", "United States", "United Kingdom", "Nigeria", "South Africa", "Germany", "Canada", "Ghana", "Brazil", "France", "India", "Mexico", "Australia", "Netherlands"];
const brands = ["Visa", "Mastercard", "Amex"];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const slugify = (name: string) =>
  name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");

export function getTransactions(): Transaction[] {
  const rand = rng(2026);
  const pick = <T>(list: T[]) => list[Math.floor(rand() * list.length)];
  const students = getStudents().filter((s) => s.paid > 0);
  const partners = getAffiliateApplications().filter((a) => a.approvedAt);
  const price = (slug: Plan["slug"]) => plans.find((p) => p.slug === slug)!.price;
  const list: Transaction[] = [];
  let n = 0;

  monthlyTargets.forEach((target, m) => {
    const days = new Date(Date.UTC(2026, m + 1, 0)).getUTCDate();
    let gross = 0;
    while (gross < target - 40) {
      const r = rand();
      const kind: Transaction["kind"] = r < 0.1 ? "upgrade" : "purchase";
      const plan: Plan["slug"] = kind === "upgrade" || r > 0.72 ? "headliner" : "resident";
      const amount = kind === "upgrade" ? price("headliner") - price("resident") : price(plan);
      const method: PaymentMethod = rand() < 0.68 ? "card" : "paypal";

      // Real sample students keep their names and photos; the rest are generated buyers.
      const student = n < students.length ? students[n] : null;
      const customer = student?.name ?? `${pick(firstNames)} ${pick(lastNames)}`;
      // Paused partners stopped earning in August.
      const eligible = partners.filter((p) => Date.parse(p.approvedAt!) < Date.UTC(2026, m, 1) && !(p.status === "paused" && m >= 7));
      const partner = kind === "purchase" && eligible.length && rand() < 0.2 ? pick(eligible) : undefined;
      const date = new Date(Date.UTC(2026, m, 1 + Math.floor(rand() * days))).toISOString().slice(0, 10);
      const refunded = rand() < 0.035;

      list.push({
        id: `txn_${(1_679_616 + n * 7919).toString(36).toUpperCase()}`,
        customer,
        email: student?.email ?? `${slugify(customer)}${n % 7 ? "" : n}@example.com`,
        avatar: student?.avatar ?? null,
        country: student?.country ?? pick(countries),
        plan,
        kind,
        amount,
        fee: processingFee(amount, method),
        method,
        source: method === "card" ? `${pick(brands)} •••• ${String(1000 + Math.floor(rand() * 9000))}` : `${slugify(customer)}@paypal`,
        status: refunded ? "refunded" : "paid",
        date,
        refundedAt: refunded ? new Date(Date.parse(date) + 3 * 86_400_000).toISOString().slice(0, 10) : null,
        affiliate: partner ? partner.code : null,
        commission: partner ? round((amount * partner.commission) / 100) : 0,
        updatedAt: `${date}T12:00:00.000Z`,
      });
      gross += amount;
      n++;
    }
  });

  return list.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

/** Monthly payouts: last month's net, paid out at the end of the following month. */
export function getPayouts(transactions = getTransactions()): Payout[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  return months
    .slice(0, -1)
    .map((label, m) => {
      const net = transactions.filter((t) => Number(t.date.slice(5, 7)) === m + 1).reduce((sum, t) => sum + netOf(t), 0);
      const last = new Date(Date.UTC(2026, m + 2, 0)).toISOString().slice(0, 10);
      return {
        id: `PO-${1001 + m * 5}`,
        amount: round(net),
        destination: m % 3 === 1 ? "PayPal · studio@ultimatedeejays.com" : "Bank •••• 4821",
        status: m === months.length - 2 ? ("in-transit" as const) : ("paid" as const),
        date: last,
        period: `${label} 2026`,
      };
    })
    .reverse();
}

/** Affiliates with referral stats rolled up from payments. Commission is paid monthly, so this month's is still owed. */
export function getAffiliateAccounts(transactions = getTransactions()): Affiliate[] {
  return getAffiliateApplications().map((app) => {
    const referred = transactions.filter((t) => t.affiliate === app.code && t.status === "paid");
    const earned = round(referred.reduce((sum, t) => sum + t.commission, 0));
    const owed = round(referred.filter((t) => t.date >= "2026-09-01").reduce((sum, t) => sum + t.commission, 0));
    return {
      ...app,
      sales: referred.length,
      revenue: referred.reduce((sum, t) => sum + t.amount, 0),
      earned,
      paidOut: round(earned - owed),
      updatedAt: `${app.appliedAt}T10:00:00.000Z`,
    };
  });
}
