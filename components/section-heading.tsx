export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  id,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  id?: string;
}) {
  const centered = align === "center";

  return (
    <div className={`reveal ${centered ? "mx-auto max-w-[40rem] text-center" : "max-w-[35rem]"}`}>
      <p className="text-base font-medium text-brand sm:text-[1.0625rem]">{eyebrow}</p>
      <h2
        id={id}
        className="mt-2 text-[1.75rem] leading-tight font-bold tracking-tight text-balance text-foreground sm:text-[2.125rem] lg:text-[2.25rem]"
      >
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground sm:text-[1.0625rem]">
          {description}
        </p>
      )}
    </div>
  );
}
