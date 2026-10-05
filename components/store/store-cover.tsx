import Image from "next/image";
import type { ComponentType, SVGProps } from "react";
import { categoryName, type FileKind, type StoreResource } from "@/lib/store";
import {
  ArchiveIcon,
  DiscIcon,
  FileTextIcon,
  HeadphonesIcon,
  ImageIcon,
  LaptopIcon,
  MegaphoneIcon,
  MusicIcon,
  PlayIcon,
  SlidersIcon,
  WaveformIcon,
} from "../icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

/* Each category's icon and tint (the same soft palette as the home page's category tiles). */
export const categoryStyle: Record<string, { icon: Icon; tint: string; ink: string }> = {
  "practice-tracks": { icon: HeadphonesIcon, tint: "bg-[#efedff] dark:bg-[#5b4bdb]/15", ink: "text-[#5b4bdb] dark:text-[#a9a0ff]" },
  "sample-packs": { icon: WaveformIcon, tint: "bg-[#e3f5ee] dark:bg-[#0f8a63]/15", ink: "text-[#0f8a63] dark:text-[#3fd3a0]" },
  stems: { icon: SlidersIcon, tint: "bg-[#fff3d6] dark:bg-[#b7791f]/15", ink: "text-[#b7791f] dark:text-[#ffc861]" },
  "cue-sheets": { icon: FileTextIcon, tint: "bg-[#ffe4ea] dark:bg-[#d6336c]/15", ink: "text-[#d6336c] dark:text-[#ff8fb1]" },
  presets: { icon: LaptopIcon, tint: "bg-[#e2eeff] dark:bg-[#2563eb]/15", ink: "text-[#2563eb] dark:text-[#8db4ff]" },
  templates: { icon: MegaphoneIcon, tint: "bg-[#ffe9dc] dark:bg-[#e8590c]/15", ink: "text-[#e8590c] dark:text-[#ffa877]" },
  artwork: { icon: ImageIcon, tint: "bg-[#ddf4f7] dark:bg-[#0e7490]/15", ink: "text-[#0e7490] dark:text-[#67d4e6]" },
  other: { icon: DiscIcon, tint: "bg-foreground/[0.05]", ink: "text-foreground/60" },
};

export const styleFor = (category: string) => categoryStyle[category] ?? categoryStyle.other;

export const fileIcons: Record<FileKind, Icon> = {
  audio: MusicIcon,
  image: ImageIcon,
  document: FileTextIcon,
  archive: ArchiveIcon,
  video: PlayIcon,
  other: FileTextIcon,
};


/**
 * The resource's cover: its thumbnail, or a tinted card with the category
 * icon when there isn't one. Fills its (relative, aspect-video) parent.
 */
export function StoreCover({
  resource,
  sizes,
  priority = false,
  compact = false,
}: {
  resource: Pick<StoreResource, "title" | "thumbnail" | "category">;
  sizes: string;
  priority?: boolean;
  /** Small covers (sidebars) show just the icon */
  compact?: boolean;
}) {
  if (resource.thumbnail) {
    return (
      <Image
        src={resource.thumbnail}
        alt=""
        fill
        sizes={sizes}
        loading={priority ? "eager" : undefined}
        fetchPriority={priority ? "high" : undefined}
        className="object-cover transition duration-500 group-hover:scale-[1.03]"
      />
    );
  }
  const style = styleFor(resource.category);
  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center text-center ${compact ? "p-1" : "gap-3 p-6"} ${style.tint}`}>
      <style.icon className={`${compact ? "size-[38%] max-h-8 max-w-8" : "size-10"} ${style.ink}`} strokeWidth={1.75} />
      <div className={compact ? "sr-only" : "max-w-[85%]"}>
        <p className={`text-xs font-semibold tracking-wide uppercase ${style.ink}`}>{categoryName(resource.category)}</p>
        <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground/80">{resource.title}</p>
      </div>
    </div>
  );
}
