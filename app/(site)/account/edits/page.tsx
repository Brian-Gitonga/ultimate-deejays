import type { Metadata } from "next";
import Link from "next/link";
import { AccountCard } from "@/components/account-card";
import { AllowanceMeters } from "@/components/edits/allowance-meters";
import { EditStatusChip } from "@/components/edits/edit-status";
import { StoreCover } from "@/components/store/store-cover";
import { requireViewer } from "@/lib/dal";
import { getMyAllowance } from "@/lib/db/allowances";
import { getMyEditRequests } from "@/lib/db/edits";
import { getUpgradeContext } from "@/lib/db/upgrade";

export const metadata: Metadata = { title: "My edits" };

const date = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" });

/* Account → My edits: what the member asked for, where each request is, and what they have left. */
export default async function MyEditsPage() {
  const viewer = await requireViewer("/account/edits");
  const [requests, allowance, upgrade] = await Promise.all([getMyEditRequests(), getMyAllowance(), getUpgradeContext()]);

  return (
    <>
      <div>
        <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-foreground">My edits</h1>
        <p className="mt-1 text-muted-foreground">Templates our team edits for you. Finished files appear here, ready to download.</p>
      </div>

      {allowance && !allowance.admin && <AllowanceMeters allowance={allowance} upgrade={upgrade} current={viewer.plan} />}

      {requests === null ? (
        <AccountCard title="Edits are on their way">
          <p className="text-muted-foreground">Asking our team to edit a template isn&apos;t switched on yet. Check back soon.</p>
        </AccountCard>
      ) : requests.length ? (
        <ul className="space-y-3">
          {requests.map((r) => {
            const fresh = r.status === "delivered" && !r.seenAt;
            return (
              <li key={r.id}>
                <Link
                  href={`/account/edits/${r.id}`}
                  className="group flex items-center gap-4 rounded-2xl border border-black/[0.06] bg-card p-3 pr-4 transition hover:border-foreground/15 sm:p-4 dark:border-white/10"
                >
                  <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-36">
                    <StoreCover resource={{ title: r.resource.title, thumbnail: r.resource.thumbnail, category: "templates", lowerThird: r.resource.lowerThird }} sizes="144px" compact />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold text-foreground group-hover:text-brand">{r.resource.title || "Template"}</span>
                      {fresh && <span className="rounded-full bg-brand px-2 py-0.5 text-[0.6875rem] font-semibold text-white">New</span>}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      Request #{r.number} · sent {date.format(new Date(r.createdAt))}
                    </span>
                  </span>
                  <EditStatusChip status={r.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <p className="text-lg font-semibold text-foreground">No edits yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Don&apos;t have editing software? Open a template with a <span className="font-medium text-foreground">Request an edit</span> button and tell us your details.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/lower-thirds" className="inline-flex h-10 items-center rounded-lg bg-[#18181b] px-4 text-sm font-semibold text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background">
              Browse lower thirds
            </Link>
            <Link href="/store" className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-foreground/5">
              Browse the store
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
