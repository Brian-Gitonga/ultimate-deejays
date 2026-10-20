import Link from "next/link";
import { FREE_BYTES, R2_PRICE_PER_GB, type StorageOverview } from "@/lib/db/studio/storage";
import { storageProviders } from "@/lib/storage";
import { formatSize } from "@/lib/store";
import { ArchiveIcon, ArrowUpRightIcon } from "../icons";

const size = (bytes: number) => formatSize(bytes) || "0 B";
const minutesAgo = (iso: string) => {
  const minutes = Math.floor((Date.now() - Date.parse(iso)) / 60_000);
  return minutes < 1 ? "just now" : `${minutes} min ago`;
};

/*
 * Studio dashboard → Storage: how full each storage is against its free
 * allowance, so there are no surprise bills. R2 is read from the bucket
 * (refreshed every few minutes); Supabase from the store's own file list.
 */
export function StorageCard({ storage }: { storage: StorageOverview }) {
  const { r2, supabase } = storage;
  return (
    <section aria-labelledby="studio-storage" className="min-w-0 rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 id="studio-storage" className="text-base font-semibold text-foreground">
          Storage
        </h2>
        <Link href="/studio/store" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Store files
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 md:divide-x md:divide-border">
        {/* Cloudflare R2 */}
        <div className="min-w-0 md:pr-6">
          <Heading name={storageProviders.r2.name} status={!r2.configured ? "Not set up" : r2.error ? "Can't check" : "Connected"} tone={!r2.configured ? "muted" : r2.error ? "warn" : "ok"} href={r2.configured ? r2.dashboardUrl : null} />
          {!r2.configured ? (
            <p className="mt-3 text-sm text-muted-foreground">Add the four R2_ keys to the site&apos;s environment (see .env.example) to store files up to 5 GB in Cloudflare R2.</p>
          ) : r2.error ? (
            <p className="mt-3 text-sm text-[#9a6400] dark:text-accent-amber">{r2.error}</p>
          ) : (
            <>
              <Meter used={r2.bytes} free={FREE_BYTES.r2} label="R2 storage used" />
              <p className="mt-2 text-sm text-muted-foreground tabular-nums">
                {r2.files} {r2.files === 1 ? "file" : "files"}
                {r2.bytes > FREE_BYTES.r2
                  ? ` · about $${(((r2.bytes - FREE_BYTES.r2) / 1024 ** 3) * R2_PRICE_PER_GB).toFixed(2)} a month beyond the free 10 GB`
                  : ` · ${size(FREE_BYTES.r2 - r2.bytes)} free left · downloads are always free`}
              </p>
              {r2.unattached.files > 0 && (
                <p className="mt-2 rounded-lg bg-accent-amber/10 px-3 py-2 text-xs text-foreground">
                  {r2.unattached.files} {r2.unattached.files === 1 ? "upload isn't" : "uploads aren't"} attached to any resource ({size(r2.unattached.bytes)}), probably from a drawer closed mid-upload. You can delete{" "}
                  {r2.unattached.files === 1 ? "it" : "them"} in Cloudflare under resources/.
                </p>
              )}
              {r2.other.files > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Includes {r2.other.files} {r2.other.files === 1 ? "file" : "files"} ({size(r2.other.bytes)}) added outside the site.
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">Checked {minutesAgo(r2.checkedAt)} · refreshes every 5 minutes.</p>
            </>
          )}
        </div>

        {/* Supabase */}
        <div className="min-w-0 md:pl-6">
          <Heading name={storageProviders.supabase.name} status="Connected" tone="ok" href={supabase.dashboardUrl} />
          <Meter used={supabase.bytes} free={FREE_BYTES.supabase} label="Supabase storage used by store files" />
          <p className="mt-2 text-sm text-muted-foreground tabular-nums">
            {supabase.files} store {supabase.files === 1 ? "file" : "files"} · {supabase.bytes > FREE_BYTES.supabase ? "over the free plan's 1 GB" : `${size(FREE_BYTES.supabase - supabase.bytes)} free left`}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Store files only. Photos, the media library and edit files share the same 1 GB; Supabase&apos;s dashboard shows the full total.
          </p>
        </div>
      </div>
    </section>
  );
}

function Heading({ name, status, tone, href }: { name: string; status: string; tone: "ok" | "warn" | "muted"; href: string | null }) {
  const dot = tone === "ok" ? "bg-brand" : tone === "warn" ? "bg-accent-amber" : "bg-foreground/25";
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="flex items-center gap-2.5 font-medium text-foreground">
        <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground/70">
          <ArchiveIcon className="size-4" />
        </span>
        {name}
        <span className="inline-flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
          <span className={`size-1.5 rounded-full ${dot}`} />
          {status}
        </span>
      </p>
      {href && (
        <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
          Open dashboard <ArrowUpRightIcon className="size-3.5" />
        </a>
      )}
    </div>
  );
}

/* Used against the free allowance; amber from 80%. */
function Meter({ used, free, label }: { used: number; free: number; label: string }) {
  const share = Math.min(1, used / free);
  return (
    <div className="mt-4">
      <p className="text-foreground">
        <span className="text-2xl font-bold tracking-tight tabular-nums">{size(used)}</span>
        <span className="ml-1.5 text-sm text-muted-foreground">of {size(free)} free</span>
      </p>
      <div role="progressbar" aria-label={label} aria-valuenow={Math.round(share * 100)} aria-valuemin={0} aria-valuemax={100} className="mt-2.5 h-2 overflow-hidden rounded-full bg-foreground/[0.07]">
        {/* A sliver stays visible for a small amount, so the bar never looks broken. */}
        <div className={`h-full rounded-full ${share >= 0.8 ? "bg-accent-amber" : "bg-brand"}`} style={{ width: used > 0 ? `max(0.375rem, ${share * 100}%)` : "0%" }} />
      </div>
    </div>
  );
}
