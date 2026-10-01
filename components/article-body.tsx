import Link from "next/link";
import type { ReactNode } from "react";
import { headingId, type Block } from "@/lib/articles";
import { LightbulbIcon } from "./icons";

// Renders the two inline marks articles use: **bold** and [text](/link).
function Inline({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((part, i): ReactNode => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      return (
        <Link
          key={i}
          href={link[2]}
          className="font-medium text-brand underline decoration-brand/30 underline-offset-4 transition hover:decoration-brand"
        >
          {link[1]}
        </Link>
      );
    }
    return part;
  });
}

const text = "text-[1.0625rem] leading-[1.8] text-foreground/80";

function renderBlock(block: Block, i: number) {
  switch (block.type) {
    case "p":
      return (
        <p key={i} className={`mt-5 first:mt-0 ${text}`}>
          <Inline text={block.text} />
        </p>
      );
    case "h2":
      return (
        <h2
          key={i}
          id={headingId(block.text)}
          className="mt-12 text-2xl leading-snug font-bold tracking-tight text-balance text-foreground first:mt-0 sm:text-[1.75rem]"
        >
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3 key={i} className="mt-8 text-xl leading-snug font-semibold text-foreground">
          {block.text}
        </h3>
      );
    case "ul":
      return (
        <ul key={i} className="mt-5 space-y-3">
          {block.items.map((item) => (
            <li
              key={item}
              className={`relative pl-7 ${text} before:absolute before:top-[0.72em] before:left-1.5 before:size-1.5 before:rounded-full before:bg-brand`}
            >
              <Inline text={item} />
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={i} className="mt-6 space-y-4">
          {block.items.map((item, n) => (
            <li key={item} className={`flex gap-4 ${text}`}>
              <span
                aria-hidden="true"
                className="mt-[0.1875rem] flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand-deep dark:text-brand"
              >
                {n + 1}
              </span>
              <span>
                <Inline text={item} />
              </span>
            </li>
          ))}
        </ol>
      );
    case "tip":
      return (
        <aside key={i} className="mt-8 rounded-2xl border border-brand/20 bg-brand/[0.06] p-5 sm:p-6">
          <p className="flex items-center gap-2 text-sm font-semibold tracking-wide text-brand-deep uppercase dark:text-brand">
            <LightbulbIcon className="size-4" />
            {block.title}
          </p>
          <p className={`mt-2 ${text}`}>
            <Inline text={block.text} />
          </p>
        </aside>
      );
    case "quote":
      return (
        <blockquote key={i} className="mt-8 border-l-4 border-brand pl-5">
          <p className="text-xl leading-relaxed font-medium text-foreground">
            <Inline text={block.text} />
          </p>
          {block.cite && <cite className="mt-2 block text-sm text-muted-foreground not-italic">{block.cite}</cite>}
        </blockquote>
      );
  }
}

export function ArticleBody({ blocks }: { blocks: Block[] }) {
  return <div>{blocks.map(renderBlock)}</div>;
}
