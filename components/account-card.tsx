import type { ReactNode } from "react";

/* A titled card for account forms, as in the reference: header, divider, body. */
export function AccountCard({
  title,
  description,
  danger = false,
  children,
}: {
  title: string;
  description?: string;
  danger?: boolean;
  children: ReactNode;
}) {
  const id = `card-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section
      aria-labelledby={id}
      className={`rounded-2xl border bg-card shadow-[0_8px_30px_-6px_rgb(0_0_0/0.06)] ${
        danger ? "border-red-500/25" : "border-black/[0.06] dark:border-white/10"
      }`}
    >
      <header className="border-b border-border px-5 py-4 sm:px-7 sm:py-5">
        <h2 id={id} className={`text-lg font-semibold ${danger ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </header>
      <div className="p-5 sm:p-7">{children}</div>
    </section>
  );
}
