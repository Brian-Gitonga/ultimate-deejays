import Link from "next/link";
import { DiscIcon } from "./icons";

/* The 404 message. Wrapped by app/not-found.tsx (unknown URLs) and app/(site)/not-found.tsx (notFound() in site pages). */
export function NotFoundContent() {
  return (
    <main className="page-header-backdrop -mt-20 flex flex-1 items-center pt-20 lg:-mt-[5.5rem] lg:pt-[5.5rem]">
      <div className="site-container py-24 text-center lg:py-32">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand/10 text-brand">
          <DiscIcon className="size-8 motion-safe:animate-[spin_4s_linear_infinite]" />
        </span>
        <p className="mt-6 text-base font-medium text-brand">404 error</p>
        <h1 className="mt-2 text-[2.125rem] leading-tight font-bold tracking-tight text-balance text-foreground sm:text-5xl">
          This track isn&apos;t in our crate
        </h1>
        <p className="mx-auto mt-4 max-w-[30rem] text-lg leading-relaxed text-pretty text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you back to the music.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-lg bg-[#18181b] px-5 text-base font-medium text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
          >
            Back to home
          </Link>
          <Link
            href="/blog"
            className="inline-flex h-11 items-center rounded-lg border border-border bg-background px-5 text-base font-medium text-foreground hover:bg-foreground/5"
          >
            Read the blog
          </Link>
        </div>
      </div>
    </main>
  );
}
