import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/content";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function PostCard({
  post,
  sizes = "(min-width: 1280px) 300px, (min-width: 1024px) 32vw, (min-width: 640px) 48vw, 85vw",
}: {
  post: Post;
  /** `sizes` for the cover image, matching the grid or carousel the card sits in */
  sizes?: string;
}) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-black/[0.06] bg-card p-2 shadow-[0_8px_30px_-6px_rgb(0_0_0/0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_-14px_rgb(0_0_0/0.2)] dark:border-white/10">
      <div className="relative aspect-[10/7] overflow-hidden rounded-xl bg-muted">
        <Image
          src={post.image}
          alt=""
          fill
          sizes={sizes}
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-neutral-900 shadow-sm backdrop-blur-sm">
          {post.category.name}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-2 pt-4 pb-2">
        <h3 className="line-clamp-2 text-[1.0625rem] leading-snug font-semibold text-foreground">
          <Link href={`/blog/${post.slug}`} className="hover:text-brand">
            {post.title}
          </Link>
        </h3>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Image
              src={post.author.image}
              alt=""
              width={72}
              height={72}
              className="size-9 shrink-0 rounded-full object-cover object-top"
            />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium text-foreground">{post.author.name}</p>
              <p className="text-[0.8125rem] text-muted-foreground">{post.readMinutes} min read</p>
            </div>
          </div>
          <time dateTime={post.publishedAt} className="shrink-0 text-[0.8125rem] text-muted-foreground">
            {dateFormat.format(new Date(post.publishedAt))}
          </time>
        </div>
      </div>
    </article>
  );
}
