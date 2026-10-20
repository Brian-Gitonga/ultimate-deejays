import Link from "next/link";
import type { StoreResource } from "@/lib/store";
import { Carousel } from "./carousel";
import { ArrowRightIcon } from "./icons";
import { SectionHeading } from "./section-heading";
import { TemplateCard } from "./store/template-card";

const isTemplate = (r: StoreResource) => r.lowerThird || r.category === "templates";

/** Newest templates first (lower thirds and templates), topped up with other new store items to fill the row. */
export function pickLatestTemplates(resources: StoreResource[], count = 8): StoreResource[] {
  const newest = [...resources].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const templates = newest.filter(isTemplate);
  return (templates.length >= 4 ? templates : [...templates, ...newest.filter((r) => !isTemplate(r))]).slice(0, count);
}

/* Landing page: the store's latest templates, in the same carousel as the courses. Hidden while the store is empty. */
export function LatestTemplates({ resources }: { resources: StoreResource[] }) {
  if (!resources.length) return null;
  return (
    <section id="latest-templates" aria-labelledby="latest-templates-title" className="relative isolate overflow-hidden py-16 lg:py-24">
      <div aria-hidden="true" className="fade-y absolute inset-0 -z-10">
        <div className="glow-violet-mint absolute inset-0" />
        <div className="grid-lines absolute inset-0" />
      </div>

      <div className="site-container">
        <SectionHeading
          id="latest-templates-title"
          eyebrow="New in the store"
          title="Latest Templates"
          description="Lower thirds, overlays and press kits for your sets and streams. Download them with your plan, or ask our team to edit one for you."
        />

        <div className="mt-10 lg:mt-12">
          <Carousel label="Latest templates" slideClassName="basis-[85%] sm:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)] xl:basis-[calc((100%-4.5rem)/4)]">
            {resources.map((resource, i) => (
              <TemplateCard key={resource.id} resource={resource} priority={i < 2} />
            ))}
          </Carousel>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/store"
            className="group inline-flex h-11 items-center gap-2 rounded-full bg-[#18181b] px-5 text-[0.9375rem] font-semibold text-white transition hover:bg-[#27272a] dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
          >
            Browse the store
            <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link href="/lower-thirds" className="inline-flex h-11 items-center rounded-full border border-border bg-background px-5 text-[0.9375rem] font-semibold text-foreground transition hover:bg-foreground/5">
            Lower thirds
          </Link>
        </div>
      </div>
    </section>
  );
}
