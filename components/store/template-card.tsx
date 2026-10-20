"use client";

import Link from "next/link";
import { categoryName, planLabel, resourcePath, type StoreResource } from "@/lib/store";
import { HoverVideo, PreviewBadge, useHoverPreview } from "./hover-preview";
import { StoreCover } from "./store-cover";

/* A store item on the landing page: the cover (its clip plays on hover), then its title and what it is. */
export function TemplateCard({ resource, priority = false }: { resource: StoreResource; priority?: boolean }) {
  const preview = useHoverPreview(resource.previewVideo);
  const free = resource.access === "warm-up";
  const kind = resource.lowerThird ? "Lower third" : categoryName(resource.category);

  return (
    <article className="group relative" {...preview.handlers}>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted ring-1 ring-black/[0.06] dark:ring-white/10">
        <StoreCover resource={resource} priority={priority} sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 85vw" titled={false} />
        <HoverVideo {...preview.video} />
        <span className={`absolute top-2.5 left-2.5 rounded px-1.5 py-0.5 text-[0.6875rem] leading-4 font-semibold ${free ? "bg-brand text-white" : "bg-black/60 text-white"}`}>
          {free ? "Free" : planLabel(resource.access)}
        </span>
        {resource.previewVideo && <PreviewBadge status={preview.status} className="absolute right-2.5 bottom-2.5" />}
      </div>
      <h3 className="mt-3 line-clamp-1 font-semibold text-foreground">
        <Link href={resourcePath(resource.slug, resource.lowerThird)} className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-brand group-hover:text-brand">
          {resource.title}
        </Link>
      </h3>
      <p className="mt-0.5 truncate text-sm text-muted-foreground">
        {kind} · {resource.creator.name}
      </p>
    </article>
  );
}
