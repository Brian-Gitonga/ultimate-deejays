import Link from "next/link";
import type { StoreResource } from "@/lib/store";
import { ArrowRightIcon, ChevronRightIcon, HomeIcon } from "./icons";
import { LowerThirdsShowcase } from "./lower-thirds-showcase";

/**
 * What the hero shows: the lower thirds picked in Studio → Store ("Show in the
 * Lower thirds hero"); until some are picked, the newest with a preview
 * video; failing that, the newest. Up to six.
 */
export function pickShowcase(lowerThirds: StoreResource[]) {
  const newest = [...lowerThirds].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const picked = newest.filter((r) => r.heroFeatured);
  const withVideo = newest.filter((r) => r.previewVideo);
  return (picked.length ? picked : withVideo.length ? withVideo : newest).slice(0, 6);
}

/** "12 designs. 5 are free with an account; members get the rest." */
function summary(count: number, free: number) {
  if (!count) return "The first designs are on their way.";
  const designs = `${count} ${count === 1 ? "design" : "designs"}`;
  if (free === count) return `${designs}, all free with an account.`;
  if (!free) return `${designs}, included in the member plans.`;
  return `${designs}. ${free} ${free === 1 ? "is" : "are"} free with an account; members get the rest.`;
}

/*
 * The /lower-thirds hero: what a lower third is and what it's for, beside the
 * featured lower thirds playing one after another (LowerThirdsShowcase). Laid out like the home hero (text
 * in five columns, the picture in seven) and sized to its content, so the
 * library starts just below it. The page is full width on big screens (like
 * the store), so the headline grows a step and the frame stops at 60rem
 * (72rem on ultra-wide screens).
 */
export function LowerThirdsHero({ count, free, showcase }: { count: number; free: number; showcase: StoreResource[] }) {
  return (
    <section aria-labelledby="lower-thirds-title" className="site-container pt-6 pb-14 sm:pt-10 lg:pb-20">
      <nav aria-label="Breadcrumb" className="mb-8 lg:mb-12">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="flex items-center text-foreground transition hover:text-brand">
              <HomeIcon className="size-4" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRightIcon className="size-3.5" />
          </li>
          <li aria-current="page">Lower thirds</li>
        </ol>
      </nav>

      <div className="grid items-center gap-x-12 gap-y-10 lg:grid-cols-12">
        {/* Text alone (full width) until there are lower thirds to show beside it. */}
        <div className={showcase.length ? "lg:col-span-5" : "lg:col-span-12"}>
          <h1
            id="lower-thirds-title"
            className="max-w-[30rem] text-[2.125rem] leading-[1.15] font-bold tracking-tight text-balance text-foreground sm:text-[2.75rem] xl:text-[3rem] min-[120rem]:max-w-[36rem] min-[120rem]:text-[3.5rem] min-[140rem]:max-w-[40rem] min-[140rem]:text-[4rem]"
          >
            Lower thirds for your streams, mixes and gigs
          </h1>
          <p className="mt-5 max-w-[32rem] text-[1.0625rem] leading-[1.65] text-pretty text-muted-foreground xl:text-lg min-[120rem]:max-w-[36rem] min-[120rem]:text-xl min-[140rem]:max-w-[40rem] min-[140rem]:text-[1.375rem]">
            The name strap along the bottom of the screen that tells people who&apos;s playing. Pick a design, add your name and put it over your livestream, your
            YouTube mix or the screens at your next gig.
          </p>
          {count > 0 && (
            <Link
              href="#browse"
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-[#18181b] px-5 text-base font-medium text-white transition hover:bg-[#27272a] dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
            >
              Browse lower thirds
              <ArrowRightIcon className="size-4 rotate-90" />
            </Link>
          )}
          <p className={`${count > 0 ? "mt-4" : "mt-6"} max-w-[32rem] text-sm text-muted-foreground`}>
            {summary(count, free)}{" "}
            <Link href="/pricing" className="font-medium whitespace-nowrap text-brand hover:underline">
              Compare plans
            </Link>
          </p>
        </div>

        {/* On very large screens the page is full width, so the frame stops growing and keeps the library in view. */}
        {showcase.length > 0 && (
          <div className="w-full lg:col-span-7 lg:max-w-[60rem] lg:justify-self-end min-[140rem]:max-w-[72rem]">
            <LowerThirdsShowcase items={showcase} />
          </div>
        )}
      </div>
    </section>
  );
}
