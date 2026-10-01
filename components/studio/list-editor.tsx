"use client";

import { CloseIcon, PlusIcon } from "../icons";
import { inputClass } from "./ui";

/*
 * An editable list of short lines (learning outcomes, requirements…).
 * Always shows at least `min` rows so instructors see how many are expected.
 */
export function ListEditor({
  id,
  items,
  onChange,
  min = 1,
  max = 12,
  maxLength = 120,
  placeholders,
}: {
  id: string;
  items: string[];
  onChange: (items: string[]) => void;
  min?: number;
  max?: number;
  maxLength?: number;
  placeholders: string[];
}) {
  const rows = items.length >= min ? items : [...items, ...Array(min - items.length).fill("")];

  const update = (index: number, value: string) => onChange(rows.map((item, i) => (i === index ? value : item)));
  const removeAt = (index: number) => onChange(rows.filter((_, i) => i !== index));

  return (
    <div className="space-y-2.5">
      {rows.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id={i === 0 ? id : undefined}
              value={item}
              maxLength={maxLength}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholders[i % placeholders.length]}
              aria-label={`Item ${i + 1}`}
              className={`${inputClass} h-11 pr-14`}
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground tabular-nums">
              {maxLength - item.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => removeAt(i)}
            disabled={rows.length <= 1}
            aria-label={`Remove item ${i + 1}`}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground disabled:opacity-30"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
      ))}
      {rows.length < max && (
        <button
          type="button"
          onClick={() => onChange([...rows, ""])}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-brand-deep hover:bg-brand/10 dark:text-brand"
        >
          <PlusIcon className="size-4" />
          Add more
        </button>
      )}
    </div>
  );
}
