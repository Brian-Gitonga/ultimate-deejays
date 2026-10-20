import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RequestEditForm } from "@/components/edits/request-edit-form";
import { UpgradeMessage } from "@/components/upgrade/upgrade-message";
import { left, meterLabel } from "@/lib/allowances";
import { PLAN_RANK, type PlanSlug } from "@/lib/plan-tiers";
import { requireViewer } from "@/lib/dal";
import { getMyAllowance } from "@/lib/db/allowances";
import { getEditSetup } from "@/lib/db/edits";
import { getStoreResource } from "@/lib/db/store";
import { getUpgradeContext } from "@/lib/db/upgrade";
import { resourcePath } from "@/lib/store";
import type { UpgradeContext, UpgradeReason } from "@/lib/upgrade";

export const metadata: Metadata = { title: "Request an edit" };


/*
 * /account/edits/new?template=<slug>: the request form for one template. The
 * template page's button explains first when a member's plan can't take the
 * request; anyone who lands here anyway gets the same friendly explanation.
 */
export default async function NewEditRequestPage({ searchParams }: PageProps<"/account/edits/new">) {
  const params = await searchParams;
  const slug = (Array.isArray(params.template) ? params.template[0] : params.template) ?? "";
  const viewer = await requireViewer(`/account/edits/new?template=${encodeURIComponent(slug)}`);
  const [resource, setup, allowance, upgrade] = await Promise.all([getStoreResource(slug), getEditSetup(slug), getMyAllowance(), getUpgradeContext()]);
  if (!resource || !setup) notFound();

  const href = resourcePath(resource.slug, resource.lowerThird);
  const edits = allowance && !allowance.admin ? allowance.edits : null;

  // Why they can't ask (yet), if they can't.
  let reason: UpgradeReason | null = null;
  if (viewer.role !== "admin" && PLAN_RANK[viewer.plan] < PLAN_RANK[resource.access]) reason = { kind: "template-plan", plan: resource.access };
  else if (edits && allowance && edits.limit === 0) reason = { kind: "edits-none" };
  else if (edits && allowance && edits.limit !== null && left(edits) === 0) reason = { kind: "edits-used", limit: edits.limit, period: allowance.period, resetsAt: allowance.resetsAt };
  else if (edits && edits.openLimit !== null && edits.open >= edits.openLimit) reason = { kind: "edits-busy", openLimit: edits.openLimit };

  return (
    <>
      <div>
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link href="/account/edits" className="hover:text-brand">
            My edits
          </Link>{" "}
          / New request
        </nav>
        <h1 className="mt-2 text-[1.75rem] leading-tight font-bold tracking-tight text-foreground">Request an edit</h1>
        <p className="mt-1 text-muted-foreground">
          We&apos;ll edit <span className="font-medium text-foreground">{resource.title}</span> with your details and send the files to your account.
        </p>
      </div>

      {reason ? (
        <Blocked reason={reason} plan={viewer.plan} upgrade={upgrade} back={href} />
      ) : (
        <RequestEditForm
          template={{ slug: resource.slug, title: resource.title, thumbnail: resource.thumbnail, category: resource.category, lowerThird: resource.lowerThird, href }}
          form={setup.form}
          turnaround={setup.turnaround}
          userId={viewer.id}
          phone={viewer.profile.phone}
          meter={edits && allowance && edits.limit !== null ? meterLabel(edits, allowance, { one: "edit request", many: "edit requests" }) : null}
        />
      )}
    </>
  );
}

/* Why they can't ask yet, the plans that would let them, and the way back. */
function Blocked({ reason, plan, upgrade, back }: { reason: UpgradeReason; plan: PlanSlug; upgrade: UpgradeContext; back: string }) {
  return (
    <section aria-labelledby="blocked-title" className="mx-auto w-full max-w-xl rounded-3xl border border-black/[0.06] bg-card p-6 shadow-[0_8px_30px_-6px_rgb(0_0_0/0.06)] sm:p-8 dark:border-white/10">
      <UpgradeMessage reason={reason} current={plan} context={upgrade} titleId="blocked-title" />
      <p className="mt-4 text-center text-sm">
        <Link href={back} className="font-medium text-muted-foreground hover:text-foreground">
          Back to the template
        </Link>
      </p>
    </section>
  );
}
