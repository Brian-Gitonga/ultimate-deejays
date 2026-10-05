"use client";

import Image from "next/image";
import { useState } from "react";
import { referralUrl } from "@/lib/affiliate-links";
import type { PromoAsset, SwipeCopy } from "@/lib/affiliate-portal";
import { siteUrl } from "@/lib/site";
import { CheckIcon, CloseIcon, DownloadIcon } from "../icons";
import { Panel } from "../studio/ui";
import { CopyButton } from "./copy-button";

const tabs = [
  { key: "all", label: "All files" },
  { key: "banner", label: "Website banners" },
  { key: "social", label: "Social posts" },
  { key: "logo", label: "Logos" },
  { key: "photo", label: "Photos" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

function embedCode(asset: PromoAsset, link: string) {
  const [w, h] = asset.size.split("×").map((n) => n.trim());
  return `<a href="${link}" target="_blank" rel="sponsored noopener"><img src="${new URL(asset.file, siteUrl)}" width="${w}" height="${h}" alt="Learn to DJ online with Ultimate Deejays"></a>`;
}

export function PromoLibrary({ code, assets, copy, colors }: { code: string; assets: PromoAsset[]; copy: SwipeCopy[]; colors: { name: string; hex: string }[] }) {
  const [tab, setTab] = useState<TabKey>("all");
  const link = referralUrl(code);
  const shown = assets.filter((a) => tab === "all" || a.kind === tab);
  const fill = (text: string) => text.replaceAll("{link}", link).replaceAll("{code}", code);

  return (
    <>
      <Panel title="Banners, posts & logos" description="Download a file and add your referral link where you post it. Banners also have embed code with your link built in.">
        <div role="tablist" aria-label="File type" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
          {tabs.map((t) => {
            const count = t.key === "all" ? assets.length : assets.filter((a) => a.kind === t.key).length;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${
                  tab === t.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                }`}
              >
                {t.label}
                <span className={`rounded-full px-1.5 text-xs tabular-nums ${tab === t.key ? "bg-background/20" : "bg-foreground/[0.07]"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {shown.map((a) => (
            <li key={a.id} className="flex flex-col overflow-hidden rounded-xl border border-border bg-background">
              <div
                className={`aspect-[4/3] overflow-hidden ${
                  a.surface === "dark" ? "bg-neutral-900 p-4" : a.kind === "photo" ? "bg-muted" : "p-4 bg-[repeating-conic-gradient(var(--color-muted)_0%_25%,transparent_0%_50%)] bg-[length:1.25rem_1.25rem]"
                }`}
              >
                <Image
                  src={a.file}
                  alt={`${a.title} preview`}
                  width={600}
                  height={450}
                  unoptimized={a.format === "SVG"}
                  className={`size-full ${a.kind === "photo" ? "object-cover" : "object-contain"}`}
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-foreground">{a.title}</p>
                  <span className="shrink-0 rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[0.6875rem] font-semibold text-foreground/70">{a.format}</span>
                </div>
                <p className="text-sm text-muted-foreground">{a.size}</p>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{a.use}</p>
                <div className="mt-4 flex gap-2">
                  <a
                    href={a.file}
                    download
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#18181b] px-3 text-sm font-semibold text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
                  >
                    <DownloadIcon className="size-4" /> Download
                  </a>
                  {a.kind === "banner" && <CopyButton text={embedCode(a, link)} label="Embed code" />}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Captions & email copy" description="Ready-to-post text with your link and code already filled in. Tweak it so it sounds like you.">
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {copy.map((c) => (
            <li key={c.id} className="flex flex-col rounded-xl border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-brand uppercase">{c.channel}</p>
                  <p className="mt-0.5 font-semibold text-foreground">{c.title}</p>
                </div>
                <CopyButton text={fill(c.text)} />
              </div>
              <p className="mt-3 flex-1 rounded-lg bg-muted/60 p-3 text-sm leading-relaxed break-words whitespace-pre-line text-foreground/85">{fill(c.text)}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Brand colours" description="Click a colour to copy its hex code.">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {colors.map((c) => (
              <li key={c.hex} className="overflow-hidden rounded-xl border border-border">
                <span className="block h-16" style={{ backgroundColor: c.hex }} />
                <div className="flex items-center justify-between gap-2 p-2.5 pl-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">{c.name}</span>
                    <span className="block font-mono text-xs text-muted-foreground">{c.hex}</span>
                  </span>
                  <CopyButton text={c.hex} iconOnly label={`Copy ${c.name}`} className="size-8 px-0" />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Promotion rules" description="Keep the program fair for everyone.">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-foreground">Do</p>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {["Share your honest experience", "Say it's an affiliate link (#ad or “I earn a commission”)", "Use our banners and logo as they are", "Point people to the free plan first"].map((t) => (
                  <li key={t} className="flex gap-2">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Don&apos;t</p>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {["Run paid ads on “Ultimate Deejays”", "Post your link on coupon sites", "Promise discounts we don't offer", "Change the logo or its colours"].map((t) => (
                  <li key={t} className="flex gap-2">
                    <CloseIcon className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
