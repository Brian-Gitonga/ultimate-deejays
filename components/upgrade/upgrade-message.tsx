import Link from "next/link";
import type { PlanSlug } from "@/lib/allowances";
import { upgradeCopy, upgradeCredit, upgradeOptions, type UpgradeContext, type UpgradeReason } from "@/lib/upgrade";
import { DownloadIcon, LockIcon, PencilIcon } from "../icons";
import { UpgradeOptions } from "./upgrade-options";

/*
 * What the member ran into, in plain words, and the plans that would let them
 * do it. The body of the upgrade dialog and of the edit-request page when
 * their plan can't take the request.
 */
export function UpgradeMessage({ reason, current, context, titleId }: { reason: UpgradeReason; current: PlanSlug; context: UpgradeContext; titleId: string }) {
  const options = upgradeOptions(context.plans, current, reason);
  const planName = context.plans.find((p) => p.slug === current)?.name ?? "current";
  const { title, text } = upgradeCopy(reason, planName, options.map((o) => o.name));
  const Icon = reason.kind.startsWith("downloads") ? DownloadIcon : reason.kind === "template-plan" ? LockIcon : PencilIcon;

  return (
    <>
      <span className="flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <Icon className="size-5" />
      </span>
      <h2 id={titleId} className="mt-4 pr-8 text-xl leading-snug font-semibold text-balance text-foreground">
        {title}
      </h2>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">{text}</p>

      <div className="mt-5">
        {reason.kind === "edits-busy" ? (
          <Link
            href="/account/edits"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#18181b] text-sm font-semibold text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background"
          >
            See my edits
          </Link>
        ) : (
          <UpgradeOptions options={options} currency={context.currency} credit={upgradeCredit(context, current)} />
        )}
      </div>
    </>
  );
}
