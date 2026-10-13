"use client";

import { useRouter } from "next/navigation";
import { downloadHref } from "@/lib/store";
import { DownloadStateIcon, useDownload } from "./download-progress";

/* "Download again" for a template in Account → Overview, with its progress. Refreshes the page's counts once it starts. */
export function DownloadAgain({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  const { state, follow } = useDownload(() => router.refresh());
  return (
    <a
      href={downloadHref([slug])}
      onClick={follow}
      aria-label={`Download ${title} again`}
      aria-busy={state === "preparing" || undefined}
      title={state === "started" ? "Download started" : "Download again"}
      className={`flex size-9 shrink-0 items-center justify-center rounded-full border transition hover:bg-foreground/5 ${
        state === "started" ? "border-brand/40 text-brand" : "border-border text-foreground"
      } ${state === "preparing" ? "cursor-progress" : ""}`}
    >
      <DownloadStateIcon state={state} />
    </a>
  );
}
