"use client";

import Link from "next/link";
import { useState } from "react";
import { left, meterLabel } from "@/lib/allowances";
import { downloadHref, fileExt, fileKind, formatSize, planLabel, resourcePath, type StorePlan, type StoreResource } from "@/lib/store";
import type { EditField } from "@/lib/edits";
import type { UpgradeContext, UpgradeReason } from "@/lib/upgrade";
import { ArrowRightIcon, DownloadIcon, LockIcon, PencilIcon } from "../icons";
import { RequestEditDialog } from "../edits/request-edit-dialog";
import { UpgradeDialog } from "../upgrade/upgrade-dialog";
import { downloadBlock, limitedAllowance, useLimitBounce } from "./download-limit";
import { fileIcons } from "./store-cover";
import { accessFor, useRefreshStoreViewer, useStoreViewer } from "./store-viewer";
import { DownloadStateIcon, useDownload } from "./download-progress";

const primary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[0.9375rem] font-semibold whitespace-nowrap transition focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none";

const PLAN_RANK: Record<StorePlan, number> = { "warm-up": 0, resident: 1, headliner: 2 };

/**
 * The main button on a resource page: Download (all), Log in, or Unlock, with
 * how many downloads the member has left. When their plan has none left, the
 * button stays the same and tapping it explains why, with the plans that
 * include more.
 */
export function DownloadButton({ resource, upgrade }: { resource: StoreResource; upgrade?: UpgradeContext }) {
  const viewer = useStoreViewer();
  const access = accessFor(viewer, resource.access);
  const [bounced, dismissBounce] = useLimitBounce();
  const [prompt, setPrompt] = useState(false);
  // Once the file starts, ask again how many downloads are left.
  const { state, follow } = useDownload(useRefreshStoreViewer());
  const allowance = limitedAllowance(viewer);
  const block = downloadBlock(allowance, bounced);
  const downloads = allowance?.downloads;
  const many = resource.files.length > 1;
  const size = formatSize(resource.totalSize);
  const back = encodeURIComponent(resourcePath(resource.slug, resource.lowerThird));
  const href = downloadHref([resource.slug]);

  if (access === "loading") return <span className={`${primary} w-44 animate-pulse bg-foreground/[0.08]`} aria-hidden="true" />;

  if (access === "signin") {
    return (
      <div className="flex flex-col items-start gap-1.5 sm:items-end">
        <Link href={`/login?next=${back}`} className={`${primary} bg-[#18181b] text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background`}>
          <DownloadIcon className="size-4" />
          Log in to download
        </Link>
        <p className="text-xs text-muted-foreground">
          No account?{" "}
          <Link href={`/sign-up?next=${back}`} className="font-medium text-brand hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    );
  }

  if (access === "locked") {
    return (
      <div className="flex flex-col items-start gap-1.5 sm:items-end">
        <Link href={`/checkout?plan=${resource.access}`} className={`${primary} bg-brand text-white hover:brightness-110`}>
          <LockIcon className="size-4" />
          Unlock with {planLabel(resource.access)}
          <ArrowRightIcon className="size-4" />
        </Link>
        <p className="text-xs text-muted-foreground">Included in the {planLabel(resource.access)} plan{resource.access === "resident" ? " and up" : ""}.</p>
      </div>
    );
  }

  const closePrompt = () => {
    setPrompt(false);
    dismissBounce();
  };
  const note =
    state === "preparing"
      ? many
        ? "Packing your ZIP…"
        : "Getting your file ready…"
      : state === "started"
        ? "Download started. Check your downloads folder."
        : many
          ? `${resource.files.length} files in one ZIP, or pick single files below.`
          : `${fileExt(resource.files[0]?.name ?? "")} file`;

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <a
        href={href}
        onClick={(event) => {
          if (block) {
            event.preventDefault();
            setPrompt(true);
            return;
          }
          follow(event);
        }}
        aria-busy={state === "preparing" || undefined}
        className={`${primary} bg-brand text-white hover:brightness-110 ${state === "preparing" ? "cursor-progress" : ""}`}
      >
        <DownloadStateIcon state={state} />
        {many ? "Download all" : "Download"}
        {size && <span className="font-normal text-white/80">· {many ? `ZIP, ${size}` : size}</span>}
      </a>
      <p className="text-xs text-muted-foreground sm:text-right" aria-live="polite">
        {note}
      </p>
      {/* Downloads left, only while there are some: running out is explained when they tap. */}
      {allowance && downloads && downloads.limit !== null && left(downloads) > 0 && (
        <p className="text-xs text-muted-foreground sm:text-right">{meterLabel(downloads, allowance, { one: "download", many: "downloads" })}</p>
      )}
      {/* Tapped with nothing left, or bounced back from the download route. */}
      {(prompt || bounced) && block && viewer?.signedIn && (
        <UpgradeDialog
          reason={block}
          current={viewer.plan}
          context={upgrade}
          onClose={closePrompt}
          footer={
            // Taking a template again in the same period doesn't use a download, so let them
            // (a bounce means this one wasn't taken yet, so not then).
            !bounced &&
            block.kind !== "downloads-none" && (
              <a
                href={href}
                onClick={(event) => {
                  closePrompt();
                  follow(event);
                }}
                className="font-medium text-brand hover:underline"
              >
                Downloaded this one already? Get it again
              </a>
            )
          }
        />
      )}
    </div>
  );
}

/** Why this member can't ask for an edit of a template needing `access`, if they can't. */
function editBlock(viewer: ReturnType<typeof useStoreViewer>, access: StorePlan): UpgradeReason | null {
  if (!viewer?.signedIn || viewer.isAdmin) return null;
  if (PLAN_RANK[viewer.plan] < PLAN_RANK[access]) return { kind: "template-plan", plan: access };
  const allowance = viewer.allowance;
  const e = allowance?.edits;
  if (!allowance || !e) return null;
  if (e.limit === 0) return { kind: "edits-none" };
  if (e.limit !== null && left(e) === 0) return { kind: "edits-used", limit: e.limit, period: allowance.period, resetsAt: allowance.resetsAt };
  if (e.openLimit !== null && e.open >= e.openLimit) return { kind: "edits-busy", openLimit: e.openLimit };
  return null;
}

/*
 * Beside Download on templates that offer edits: for members without the
 * software. Signed-in members get the request form in a modal, right here; if
 * their plan can't take another request, tapping explains why (and which plan
 * would) instead. Signed out, it goes through the log-in page to the form.
 */
export function RequestEditButton({ resource, form, turnaround, upgrade }: { resource: StoreResource; form: EditField[]; turnaround: string; upgrade?: UpgradeContext }) {
  const viewer = useStoreViewer();
  const refreshViewer = useRefreshStoreViewer();
  const [open, setOpen] = useState<"form" | "upgrade" | null>(null);
  const block = editBlock(viewer, resource.access);
  const edits = viewer?.signedIn && viewer.allowance && !viewer.allowance.admin ? viewer.allowance.edits : null;
  const meter = viewer?.signedIn && viewer.allowance && edits && edits.limit !== null ? meterLabel(edits, viewer.allowance, { one: "edit request", many: "edit requests" }) : null;

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <Link
        href={`/account/edits/new?template=${encodeURIComponent(resource.slug)}`}
        onClick={(event) => {
          if (!viewer?.signedIn || event.metaKey || event.ctrlKey || event.shiftKey) return;
          event.preventDefault();
          setOpen(block ? "upgrade" : "form");
        }}
        aria-haspopup="dialog"
        className={`${primary} border border-border bg-background text-foreground hover:border-foreground/30 hover:bg-foreground/[0.04]`}
      >
        <PencilIcon className="size-4" />
        Request an edit
      </Link>
      <p className="max-w-xs text-xs text-muted-foreground sm:text-right">No editing software? Tell us your details and we&apos;ll edit it for you{turnaround ? ` · ${turnaround}` : ""}.</p>
      {open === "upgrade" && block && viewer?.signedIn && <UpgradeDialog reason={block} current={viewer.plan} context={upgrade} onClose={() => setOpen(null)} />}
      {open === "form" && viewer?.signedIn && (
        <RequestEditDialog
          template={{ slug: resource.slug, title: resource.title, thumbnail: resource.thumbnail, category: resource.category, lowerThird: resource.lowerThird, href: resourcePath(resource.slug, resource.lowerThird) }}
          form={form}
          turnaround={turnaround}
          userId={viewer.id}
          phone={viewer.phone}
          meter={meter}
          onClose={() => setOpen(null)}
          onSent={refreshViewer}
        />
      )}
    </div>
  );
}

/* One file's Download link, with its own progress. */
function FileDownload({ slug, file }: { slug: string; file: StoreResource["files"][number] }) {
  const { state, follow } = useDownload(useRefreshStoreViewer());
  return (
    <a
      href={downloadHref([slug], [file.id])}
      onClick={follow}
      aria-label={`Download ${file.name}`}
      aria-busy={state === "preparing" || undefined}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition hover:bg-foreground/5 ${
        state === "started" ? "border-brand/40 text-brand-deep dark:text-brand" : "border-border text-foreground"
      } ${state === "preparing" ? "cursor-progress" : ""}`}
    >
      <DownloadStateIcon state={state} />
      <span className="hidden sm:inline">Download</span>
    </a>
  );
}

/** What's inside: every file, each downloadable on its own. */
export function FileList({ resource }: { resource: StoreResource }) {
  const access = accessFor(useStoreViewer(), resource.access);
  return (
    <ul className="divide-y divide-border">
      {resource.files.map((file) => {
        const Icon = fileIcons[fileKind(file)];
        return (
          <li key={file.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.05] text-foreground/70">
              <Icon className="size-[1.125rem]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {fileExt(file.name)}
                {file.size ? ` · ${formatSize(file.size)}` : ""}
              </p>
            </div>
            {access === "open" ? (
              <FileDownload slug={resource.slug} file={file} />
            ) : (
              access !== "loading" && <LockIcon className="size-4 shrink-0 text-muted-foreground" role="img" aria-hidden={false} aria-label={access === "signin" ? "Log in to download" : `${planLabel(resource.access)} plan`} />
            )}
          </li>
        );
      })}
    </ul>
  );
}
