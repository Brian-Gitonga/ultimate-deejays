/*
 * Affiliate program. PLACEHOLDER: sample applications and partners.
 * With a backend, applications arrive from a public "Become an affiliate"
 * form and clicks/sign-ups come from tracked referral links.
 */

export type AffiliateStatus = "pending" | "approved" | "paused" | "rejected";

export type Affiliate = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  /** Where they'll promote us */
  channel: string;
  channelUrl: string;
  audience: number;
  pitch: string;
  status: AffiliateStatus;
  appliedAt: string;
  approvedAt: string | null;
  /** Commission on each referred sale, in % */
  commission: number;
  code: string;
  clicks: number;
  signups: number;
  sales: number;
  /** Referred revenue, USD */
  revenue: number;
  /** Lifetime commission, USD */
  earned: number;
  paidOut: number;
  note: string;
  updatedAt: string;
};

export type AffiliateApplication = Omit<Affiliate, "sales" | "revenue" | "earned" | "paidOut" | "updatedAt">;

/** Applications and partners without sales stats; getAffiliateAccounts() in lib/earnings rolls those up from payments. */
export function getAffiliateApplications(): AffiliateApplication[] {
  return [
    { id: "aff-01", name: "Kaya Mensah", email: "kaya@djkaya.com", avatar: "/images/students/student-2.jpg", channel: "YouTube", channelUrl: "https://youtube.com/@djkaya", audience: 48200, pitch: "I post weekly controller tutorials for beginners and get asked every week where to learn properly.", status: "approved", appliedAt: "2026-03-02", approvedAt: "2026-03-04", commission: 25, code: "DJKAYA", clicks: 4210, signups: 312, note: "" },
    { id: "aff-02", name: "Beat Lab Podcast", email: "hello@beatlab.fm", avatar: null, channel: "Podcast", channelUrl: "https://beatlab.fm", audience: 21000, pitch: "Weekly DJ culture podcast with around 20k downloads per episode. Happy to do a host-read spot.", status: "approved", appliedAt: "2026-04-11", approvedAt: "2026-04-12", commission: 20, code: "BEATLAB", clicks: 1980, signups: 144, note: "" },
    { id: "aff-03", name: "Vinyl Vibes Store", email: "team@vinylvibes.shop", avatar: null, channel: "Record store", channelUrl: "https://vinylvibes.shop", audience: 9500, pitch: "Independent record shop in Leeds. We'd add a banner and mention you in our monthly newsletter.", status: "approved", appliedAt: "2026-05-20", approvedAt: "2026-05-22", commission: 20, code: "VINYLVIBES", clicks: 860, signups: 71, note: "" },
    { id: "aff-04", name: "Nia Kamau", email: "nia@mixwithnia.com", avatar: "/images/students/student-3.jpg", channel: "TikTok", channelUrl: "https://tiktok.com/@mixwithnia", audience: 132000, pitch: "Amapiano transitions in 30 seconds. My audience keeps asking where to learn the basics properly.", status: "approved", appliedAt: "2026-02-03", approvedAt: "2026-02-05", commission: 30, code: "MIXWITHNIA", clicks: 9020, signups: 588, note: "Top partner, agreed 30% in February." },
    { id: "aff-05", name: "Studio Sessions Blog", email: "editor@studiosessions.io", avatar: null, channel: "Blog", channelUrl: "https://studiosessions.io", audience: 14000, pitch: "Gear reviews and DJ guides, around 40k monthly readers.", status: "paused", appliedAt: "2026-01-14", approvedAt: "2026-01-16", commission: 15, code: "STUDIOSESH", clicks: 1204, signups: 58, note: "Paused while they update an outdated price on their review." },
    { id: "aff-06", name: "Diego Ramos", email: "diego@djdiego.mx", avatar: "/images/students/student-1.jpg", channel: "Instagram", channelUrl: "https://instagram.com/djdiego.mx", audience: 26400, pitch: "Wedding DJ in Mexico City. I mentor new DJs every month and would send them your Resident plan.", status: "pending", appliedAt: "2026-09-27", approvedAt: null, commission: 20, code: "DJDIEGO", clicks: 0, signups: 0, note: "" },
    { id: "aff-07", name: "Campus Beats Society", email: "committee@campusbeats.org", avatar: null, channel: "Student society", channelUrl: "https://campusbeats.org", audience: 1800, pitch: "University DJ society. We'd recommend you to every new member at freshers' week.", status: "pending", appliedAt: "2026-09-29", approvedAt: null, commission: 20, code: "CAMPUSBEATS", clicks: 0, signups: 0, note: "" },
    { id: "aff-08", name: "Lerato Dube", email: "lerato@leratodube.co.za", avatar: "/images/students/student-4.jpg", channel: "YouTube", channelUrl: "https://youtube.com/@leratodube", audience: 67000, pitch: "Amapiano producer and DJ with 67k subscribers. I run weekly livestream sets and tutorials.", status: "pending", appliedAt: "2026-09-30", approvedAt: null, commission: 20, code: "LERATO", clicks: 0, signups: 0, note: "" },
    { id: "aff-09", name: "Quick Coupons Hub", email: "deals@quickcoupons.biz", avatar: null, channel: "Coupon site", channelUrl: "https://quickcoupons.biz", audience: 0, pitch: "We list discount codes.", status: "rejected", appliedAt: "2026-08-12", approvedAt: null, commission: 20, code: "QUICKCOUP", clicks: 0, signups: 0, note: "Coupon aggregator, not a fit for the program." },
  ];
}

export const balanceOf = (x: Pick<Affiliate, "earned" | "paidOut">) => Math.round((x.earned - x.paidOut) * 100) / 100;

export const affiliateStatusLabel: Record<AffiliateStatus, string> = {
  pending: "Pending",
  approved: "Active",
  paused: "Paused",
  rejected: "Declined",
};
