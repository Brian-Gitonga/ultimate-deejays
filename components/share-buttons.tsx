"use client";

import { useState, type ComponentType, type SVGProps } from "react";
import { ChatIcon, CheckIcon, FacebookIcon, LinkIcon, LinkedinIcon, XIcon } from "./icons";

type Network = {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  shareUrl: (url: string, title: string) => string;
};

const networks: Network[] = [
  { label: "Share on X", icon: XIcon, shareUrl: (url, title) => `https://twitter.com/intent/tweet?url=${url}&text=${title}` },
  { label: "Share on Facebook", icon: FacebookIcon, shareUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${url}` },
  { label: "Share on LinkedIn", icon: LinkedinIcon, shareUrl: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${url}` },
  { label: "Share on WhatsApp", icon: ChatIcon, shareUrl: (url, title) => `https://wa.me/?text=${title}%20${url}` },
];

// The page's own address, without any #section fragment.
const pageUrl = () => window.location.origin + window.location.pathname;

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked; the share buttons still work.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {networks.map(({ label, icon: Icon, shareUrl }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          title={label}
          onClick={() =>
            window.open(
              shareUrl(encodeURIComponent(pageUrl()), encodeURIComponent(title)),
              "_blank",
              "noopener,noreferrer,width=640,height=560",
            )
          }
          className="flex size-10 items-center justify-center rounded-full bg-foreground/[0.06] text-foreground/70 transition hover:bg-brand hover:text-white"
        >
          <Icon className="size-[1.125rem]" />
        </button>
      ))}
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground/[0.06] px-4 text-sm font-medium text-foreground/80 transition hover:bg-foreground/10"
      >
        {copied ? <CheckIcon className="size-4 text-brand" /> : <LinkIcon className="size-4" />}
        {copied ? "Copied!" : "Copy link"}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </div>
  );
}
