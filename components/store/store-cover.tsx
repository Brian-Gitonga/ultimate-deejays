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
 * icon when there isn't one (lower thirds get their graphic on a
 * transparency checkerboard). Fills its (relative, aspect-video) parent.
 */
export function StoreCover({
  resource,
  sizes,
  priority = false,
  compact = false,
  titled = true,
}: {
  resource: Pick<StoreResource, "title" | "thumbnail" | "category"> & { lowerThird?: boolean };
  sizes: string;
  priority?: boolean;
  /** Small covers (sidebars) show just the icon */
  compact?: boolean;
  /** Show the title on a drawn cover. Off where the title is shown over it anyway (the store grid). */
  titled?: boolean;
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
  if (resource.lowerThird) return <LowerThirdCover title={titled ? resource.title : "Your name"} compact={compact} />;
  const style = styleFor(resource.category);
  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center text-center ${compact ? "p-1" : "gap-3 p-6"} ${style.tint}`}>
      <style.icon className={`${compact ? "size-[38%] max-h-8 max-w-8" : "size-10"} ${style.ink}`} strokeWidth={1.75} />
      <div className={compact ? "sr-only" : "max-w-[85%]"}>
        <p className={`text-xs font-semibold tracking-wide uppercase ${style.ink}`}>{categoryName(resource.category)}</p>
        {titled && <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground/80">{resource.title}</p>}
      </div>
    </div>
  );
}

/*
 * A lower third without a thumbnail: the graphic on a transparency
 * checkerboard, the way an editor shows an overlay file, in the brand's
 * Night and green (like the example on /lower-thirds). Sized in container
 * units, so it reads the same on a card, in a sidebar or in a studio row.
 */
function LowerThirdCover({ title, compact }: { title: string; compact: boolean }) {
  return (
    <div className="@container absolute inset-0 overflow-hidden bg-[#f4f4f5] dark:bg-[#29292d]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[repeating-conic-gradient(#e6e6e9_0%_25%,transparent_0%_50%)] bg-[length:4cqw_4cqw] dark:bg-[repeating-conic-gradient(#323237_0%_25%,transparent_0%_50%)]"
      />
      {compact ? (
        // Too small for words: the two plates as solid shapes.
        <div className="absolute bottom-[16%] left-[8%] flex flex-col items-start">
          <span className="block h-[11cqw] w-[54cqw] bg-[#0a0f0d]" />
          <span className="block h-[5cqw] w-[34cqw] bg-[#00a76f]" />
        </div>
      ) : (
        <div className="absolute bottom-[14%] left-[6%] flex max-w-[86%] flex-col items-start drop-shadow-[0_0.5cqw_1.2cqw_rgb(0_0_0/0.18)]">
          <span className="block max-w-full truncate bg-[#0a0f0d] px-[3cqw] py-[2cqw] text-[5.4cqw] leading-none font-bold tracking-[-0.02em] text-white">{title}</span>
          <span className="block bg-[#00a76f] px-[3cqw] py-[1.3cqw] text-[max(0.5625rem,2.3cqw)] leading-none font-semibold tracking-[0.12em] text-[#0a0f0d] uppercase">
            Lower third
          </span>
        </div>
      )}
    </div>
  );
}
