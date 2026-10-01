"use client";

import { useId, useState } from "react";
import { ChevronDownIcon } from "./icons";

export type FaqItem = { question: string; answer: string };

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => {
        const isOpen = open === i;
        const buttonId = `${baseId}-q${i}`;
        const panelId = `${baseId}-a${i}`;

        return (
          <div
            key={item.question}
            className={`rounded-2xl transition-colors duration-300 ${
              isOpen ? "bg-card/80 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.12)] ring-1 ring-black/5 dark:ring-white/10" : ""
            }`}
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 rounded-2xl px-5 py-4 text-left text-base font-semibold text-foreground hover:text-brand sm:text-[1.0625rem]"
              >
                {item.question}
                <ChevronDownIcon
                  className={`size-5 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-brand" : ""}`}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!isOpen}
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-[0.9375rem] leading-relaxed text-muted-foreground">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
