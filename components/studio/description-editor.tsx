"use client";

import { useRef, useState, type ReactNode } from "react";
import { wordCount } from "@/lib/studio-courses";
import { inputClass } from "./ui";

/*
 * Course description editor. Stores lightweight Markdown (portable to any
 * backend and safe to render): **bold**, *italic*, ## headings, - and 1.
 * lists, > quotes and [links](url). The toolbar inserts the syntax for you.
 */

type Action = { label: string; title: string; run: (sel: string) => { text: string; block?: boolean } };

const actions: Action[] = [
  { label: "B", title: "Bold", run: (s) => ({ text: `**${s || "bold text"}**` }) },
  { label: "I", title: "Italic", run: (s) => ({ text: `*${s || "italic text"}*` }) },
  { label: "H", title: "Heading", run: (s) => ({ text: `## ${s || "Heading"}`, block: true }) },
  { label: "•", title: "Bulleted list", run: (s) => ({ text: (s || "List item").split("\n").map((l) => `- ${l}`).join("\n"), block: true }) },
  { label: "1.", title: "Numbered list", run: (s) => ({ text: (s || "First step").split("\n").map((l, i) => `${i + 1}. ${l}`).join("\n"), block: true }) },
  { label: "“", title: "Quote", run: (s) => ({ text: `> ${s || "Quote"}`, block: true }) },
  { label: "🔗", title: "Link", run: (s) => ({ text: `[${s || "link text"}](https://)` }) },
];

export function DescriptionEditor({ id, value, onChange, invalid }: { id: string; value: string; onChange: (v: string) => void; invalid?: boolean }) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const ref = useRef<HTMLTextAreaElement>(null);

  function apply(action: Action) {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const { text, block } = action.run(value.slice(a, b));
    const before = value.slice(0, a);
    const prefix = block && before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
    const next = before + prefix + text + value.slice(b);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = (before + prefix + text).length;
      el.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className={`overflow-hidden rounded-xl border ${invalid ? "border-red-500" : "border-border"} bg-background focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/50 px-2 py-1.5">
        <div role="toolbar" aria-label="Formatting" aria-controls={id} className="flex flex-wrap gap-0.5">
          {actions.map((action) => (
            <button
              key={action.title}
              type="button"
              title={action.title}
              aria-label={action.title}
              disabled={tab === "preview"}
              onClick={() => apply(action)}
              className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm text-foreground hover:bg-foreground/[0.08] disabled:opacity-40 ${
                action.label === "B" ? "font-bold" : action.label === "I" ? "font-serif italic" : "font-medium"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
        <div role="tablist" aria-label="Editor mode" className="flex rounded-lg bg-foreground/[0.06] p-0.5 text-xs font-semibold">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-md px-2.5 py-1 capitalize ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "write" ? (
        <textarea
          ref={ref}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (!(e.ctrlKey || e.metaKey)) return;
            const action = e.key === "b" ? actions[0] : e.key === "i" ? actions[1] : null;
            if (action) {
              e.preventDefault();
              apply(action);
            }
          }}
          rows={12}
          aria-invalid={invalid || undefined}
          placeholder="Describe the course: what students will learn, how lessons are structured, and what they'll be able to play by the end."
          className={`${inputClass} block min-h-64 resize-y rounded-none border-0 py-3 shadow-none focus:ring-0`}
        />
      ) : (
        <div className="min-h-64 px-4 py-3 text-[0.9375rem] leading-relaxed text-foreground/85">
          {value.trim() ? renderMarkdown(value) : <p className="text-muted-foreground">Nothing to preview yet.</p>}
        </div>
      )}

      <div className="flex justify-end gap-4 border-t border-border px-3 py-2 text-xs text-muted-foreground tabular-nums">
        <span>Words: {wordCount(value)}</span>
        <span>Characters: {value.length}</span>
      </div>
    </div>
  );
}

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const safe = /^(https?:\/\/|\/)/.test(link[2]) ? link[2] : "#";
      return (
        <a key={i} href={safe} target="_blank" rel="noopener noreferrer" className="text-brand underline">
          {link[1]}
        </a>
      );
    }
    return part;
  });
}

/** Renders the small Markdown subset above as React elements (no HTML injection). */
export function renderMarkdown(source: string) {
  return source
    .trim()
    .split(/\n{2,}/)
    .map((block, i) => {
      const lines = block.split("\n");
      if (block.startsWith("## ")) return <h3 key={i} className="mt-4 mb-2 text-lg font-semibold text-foreground first:mt-0">{inline(block.slice(3))}</h3>;
      if (lines.every((l) => /^- /.test(l)))
        return (
          <ul key={i} className="my-3 list-disc space-y-1 pl-5">
            {lines.map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}
          </ul>
        );
      if (lines.every((l) => /^\d+\. /.test(l)))
        return (
          <ol key={i} className="my-3 list-decimal space-y-1 pl-5">
            {lines.map((l, j) => <li key={j}>{inline(l.replace(/^\d+\. /, ""))}</li>)}
          </ol>
        );
      if (lines.every((l) => l.startsWith("> ")))
        return <blockquote key={i} className="my-3 border-l-4 border-brand pl-3 italic">{inline(lines.map((l) => l.slice(2)).join(" "))}</blockquote>;
      return <p key={i} className="my-3 first:mt-0">{inline(lines.join(" "))}</p>;
    });
}
