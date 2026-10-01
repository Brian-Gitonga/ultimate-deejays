import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      aria-label="Ultimate Deejays home"
      className="flex items-center gap-2 text-[1.375rem] font-extrabold tracking-tight text-foreground sm:text-2xl"
    >
      {/* Vinyl record mark */}
      <svg viewBox="0 0 32 32" className="size-8 text-brand" aria-hidden="true">
        <circle cx="16" cy="16" r="13.5" fill="none" stroke="currentColor" strokeWidth="3" />
        <path
          d="M16 7.5a8.5 8.5 0 0 1 8.5 8.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="16" cy="16" r="3.5" fill="currentColor" />
      </svg>
      <span>
        Ultimate<span className="text-brand">Deejays</span>
      </span>
    </Link>
  );
}
