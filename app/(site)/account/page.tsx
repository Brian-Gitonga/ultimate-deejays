import type { Metadata } from "next";
import { ContinueLearning, PlanCard, RecentDownloads, RecentEdits, UpgradeSection } from "@/components/account-overview";
import { AllowanceMeters } from "@/components/edits/allowance-meters";
import { displayName, requireViewer } from "@/lib/dal";
import { getMyAllowance } from "@/lib/db/allowances";
import { getMyEditRequests } from "@/lib/db/edits";
import { getLearningSummary } from "@/lib/db/learning";
import { getMyDownloads } from "@/lib/db/store";
import { getUpgradeContext } from "@/lib/db/upgrade";

export const metadata: Metadata = { title: "Overview" };

/*
 * Account → Overview, where the account opens: their plan, what they have
 * left on it (downloads, edits), the plans that give more, the course to pick
 * up, and their latest edit requests and downloads.
 */
export default async function AccountOverviewPage() {
  const viewer = await requireViewer("/account");
  const [allowance, upgrade, requests, downloads, learning] = await Promise.all([
    getMyAllowance(),
    getUpgradeContext(),
    getMyEditRequests(),
    getMyDownloads(5),
    getLearningSummary(viewer),
  ]);
  const isAdmin = viewer.role === "admin";
  const now = new Date().getTime();

  return (
    <>
      <div>
        <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-foreground">Overview</h1>
        <p className="mt-1 text-muted-foreground">Welcome back, {displayName(viewer)}. Here&apos;s your plan and what you have left on it.</p>
      </div>

      <PlanCard plan={viewer.plan} isAdmin={isAdmin} upgrade={upgrade} />
      {allowance && <AllowanceMeters allowance={allowance} upgrade={upgrade} current={viewer.plan} />}
      {!isAdmin && <UpgradeSection current={viewer.plan} upgrade={upgrade} />}
      <ContinueLearning learning={learning} now={now} />

      {(requests !== null || downloads !== null) && (
        <div className={`grid gap-6 ${requests !== null && downloads !== null ? "lg:grid-cols-2" : ""}`}>
          {requests !== null && <RecentEdits requests={requests} allowance={allowance} />}
          {downloads !== null && <RecentDownloads downloads={downloads} allowance={allowance} />}
        </div>
      )}
    </>
  );
}
