import type { Metadata } from "next";
import Link from "next/link";
import { AccountCard } from "@/components/account-card";
import { MixList, MixSubmitForm } from "@/components/mix-submission";
import { requireViewer } from "@/lib/dal";
import { getPublishedCourses } from "@/lib/db/courses";
import { getMixes } from "@/lib/db/studio/mixes";
import { mixAllowance } from "@/lib/mixes";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mix feedback" };

/* Send mixes to the instructors and read their feedback. How many depends on the plan. */
export default async function MixesPage() {
  const viewer = await requireViewer("/account/mixes");
  const supabase = await createClient();
  const [mixes, courses] = await Promise.all([getMixes(supabase, viewer.id), getPublishedCourses()]);

  const allowance = viewer.role === "admin" ? null : mixAllowance[viewer.plan];
  const left = allowance === null ? null : Math.max(0, allowance - mixes.length);

  return (
    <>
      <div>
        <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-foreground">Mix feedback</h1>
        <p className="mt-1 text-muted-foreground">Send a recording and an instructor will listen and tell you exactly what to work on.</p>
      </div>

      {allowance === 0 ? (
        <AccountCard title="Get feedback on your mixes">
          <p className="text-[0.9375rem] text-muted-foreground">
            Mix feedback comes with the Resident plan (2 mixes) and the Headliner plan (unlimited). Your current plan is Warm-Up.
          </p>
          <Link
            href="/pricing"
            className="mt-5 inline-flex h-11 items-center rounded-lg bg-[#18181b] px-5 text-sm font-semibold text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background"
          >
            See plans
          </Link>
        </AccountCard>
      ) : left === 0 ? (
        <AccountCard title="You've used your mix reviews">
          <p className="text-[0.9375rem] text-muted-foreground">
            Your Resident plan includes {allowance} mix reviews and you&apos;ve sent them all. Headliner includes unlimited feedback.
          </p>
          <Link href="/pricing" className="mt-5 inline-flex h-11 items-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground hover:bg-muted">
            Compare plans
          </Link>
        </AccountCard>
      ) : (
        <AccountCard title="Send a mix" description={left === null ? "Your plan includes unlimited mix feedback." : `You can send ${left} more ${left === 1 ? "mix" : "mixes"} on your plan.`}>
          <MixSubmitForm courses={courses.map((c) => ({ id: c.id, title: c.title }))} />
        </AccountCard>
      )}

      {mixes.length > 0 && (
        <AccountCard title="Your mixes">
          <MixList mixes={mixes} />
        </AccountCard>
      )}
    </>
  );
}
