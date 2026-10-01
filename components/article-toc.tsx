"use client";

import { useEffect, useState } from "react";

type TocItem = { id: string; text: string };

// A heading counts as "current" once it scrolls above this line (just under the sticky header).
const ACTIVE_LINE = 160;

/* "On this page" links; the section you're reading is highlighted as you scroll. */
export function ArticleToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | undefined>(items[0]?.id);

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        let current = headings[0]?.id;
        for (const heading of headings) {
          if (heading.getBoundingClientRect().top < ACTIVE_LINE) current = heading.id;
        }
        setActive(atBottom ? headings.at(-1)?.id : current);
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
    };
  }, [items]);

  return (
    <nav aria-label="On this page">
      <p className="text-sm font-semibold text-foreground">On this page</p>
      <ol className="mt-3 border-l border-border">
        {items.map((item) => {
          const current = item.id === active;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={current ? "location" : undefined}
                className={`-ml-px block border-l-2 py-1.5 pl-4 text-sm leading-snug transition-colors ${
                  current
                    ? "border-brand font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
