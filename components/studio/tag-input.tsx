"use client";

import { useState } from "react";
import { CloseIcon } from "../icons";

/** Type a keyword and press Enter or comma to add it; Backspace on an empty box removes the last one. */
export function TagInput({ id, tags, onChange, max = 10, placeholder }: { id: string; tags: string[]; onChange: (tags: string[]) => void; max?: number; placeholder?: string }) {
  const [text, setText] = useState("");

  function add(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 40);
    if (tag && !tags.includes(tag) && tags.length < max) onChange([...tags, tag]);
    setText("");
  }

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-border bg-background px-2 py-1.5 shadow-xs focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-foreground/[0.07] py-1 pr-1 pl-2 text-sm text-foreground">
          {tag}
          <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} aria-label={`Remove ${tag}`} className="rounded p-0.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground">
            <CloseIcon className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={text}
        onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value.slice(0, -1)) : setText(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(text);
          } else if (e.key === "Backspace" && !text && tags.length) onChange(tags.slice(0, -1));
        }}
        onBlur={() => text && add(text)}
        placeholder={tags.length >= max ? `Max ${max}` : placeholder}
        disabled={tags.length >= max}
        className="h-8 min-w-32 flex-1 bg-transparent px-1 text-[0.9375rem] text-foreground outline-none placeholder:text-muted-foreground/75"
      />
    </div>
  );
}
