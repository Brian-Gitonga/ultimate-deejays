import Image from "next/image";
import { initialsOf } from "@/lib/profile";

/* A round profile photo, or the person's initials when they haven't added one. */
export function UserAvatar({
  src,
  name,
  className,
  pixels = 112,
  alt = "",
}: {
  src: string | null;
  name: string;
  /** Size and ring classes, e.g. "size-16 ring-4 ring-brand/15" */
  className: string;
  /** Rendered image size; roughly 2× the largest CSS size */
  pixels?: number;
  alt?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={pixels}
        height={pixels}
        // Previews of a just-picked photo are data URLs, which the optimizer can't fetch.
        unoptimized={src.startsWith("data:")}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <span
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand/10 font-semibold text-brand-deep dark:text-brand ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
}
