import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { SignUpForm } from "@/components/sign-up-form";
import { safeNextPath } from "@/lib/auth";
import { isPaidPlan } from "@/lib/checkout";
import { getSiteStats, studentsLabel } from "@/lib/db/stats";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create your Ultimate Deejays account and start learning to DJ from working pros, at your own pace.",
  alternates: { canonical: "/sign-up" },
  robots: { index: false, follow: true },
};

export default async function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  const [params, stats] = await Promise.all([searchParams, getSiteStats()]);
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  // ?plan= comes from the pricing page: after signing up, go straight to checkout.
  const plan = one(params.plan);
  const next = safeNextPath(one(params.next) ?? (isPaidPlan(plan) ? `/checkout?plan=${plan}` : undefined));

  return (
    <AuthShell
      tagline="Start mixing today"
      subline={stats.students > 0 ? `Join ${studentsLabel(stats.students)} DJs learning from working pros, at their own pace.` : "Learn from working pros, at your own pace."}
      title="Create your account"
      description="Start learning from working DJs. It only takes a minute."
    >
      <SignUpForm next={next} />
    </AuthShell>
  );
}
