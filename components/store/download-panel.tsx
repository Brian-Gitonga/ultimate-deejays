"use client";

import Link from "next/link";
import { useState } from "react";
import { downloadHref, fileExt, fileKind, formatSize, planLabel, type StoreResource } from "@/lib/store";
import { ArrowRightIcon, DownloadIcon, LockIcon } from "../icons";
import { fileIcons } from "./store-cover";
import { accessFor, useStoreViewer } from "./store-viewer";

const primary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[0.9375rem] font-semibold whitespace-nowrap transition focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none";

/** The main button on a resource page: Download (all), Log in, or Unlock. */
export function DownloadButton({ resource }: { resource: StoreResource }) {
  const access = accessFor(useStoreViewer(), resource.access);
  const [started, setStarted] = useState(false);
  const many = resource.files.length > 1;
  const size = formatSize(resource.totalSize);

  if (access === "loading") return <span className={`${primary} w-44 animate-pulse bg-foreground/[0.08]`} aria-hidden="true" />;

  if (access === "signin") {
    return (
      <div className="flex flex-col items-start gap-1.5 sm:items-end">
        <Link href={`/login?next=${encodeURIComponent(`/store/${resource.slug}`)}`} className={`${primary} bg-[#18181b] text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background`}>
          <DownloadIcon className="size-4" />
          Log in to download
        </Link>
        <p className="text-xs text-muted-foreground">
          No account?{" "}
          <Link href={`/sign-up?next=${encodeURIComponent(`/store/${resource.slug}`)}`} className="font-medium text-brand hover:underline">
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

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <a href={downloadHref([resource.slug])} onClick={() => setStarted(true)} className={`${primary} bg-brand text-white hover:brightness-110`}>
        <DownloadIcon className="size-4" />
        {many ? "Download all" : "Download"}
        {size && <span className="font-normal text-white/80">· {many ? `ZIP, ${size}` : size}</span>}
      </a>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {started ? "Your download is starting…" : many ? `${resource.files.length} files in one ZIP, or pick single files below.` : `${fileExt(resource.files[0]?.name ?? "")} file`}
      </p>
    </div>
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
              <a
                href={downloadHref([resource.slug], [file.id])}
                aria-label={`Download ${file.name}`}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium text-foreground transition hover:bg-foreground/5"
              >
                <DownloadIcon className="size-4" />
                <span className="hidden sm:inline">Download</span>
              </a>
            ) : (
              access !== "loading" && <LockIcon className="size-4 shrink-0 text-muted-foreground" role="img" aria-hidden={false} aria-label={access === "signin" ? "Log in to download" : `${planLabel(resource.access)} plan`} />
            )}
          </li>
        );
      })}
    </ul>
  );
}
