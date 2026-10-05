import Link from "next/link";
import { getLivePosts } from "@/lib/db/posts";
import { getSiteSettings } from "@/lib/db/settings";
import { Carousel } from "./carousel";
import { ArrowRightIcon } from "./icons";
import { PostCard } from "./post-card";
import { SectionHeading } from "./section-heading";

export async function LatestPosts() {
  const [posts, settings] = await Promise.all([getLivePosts(), getSiteSettings()]);
  // Studio → Settings → Blog → "Latest posts on the home page" (0 hides the section).
  const count = settings.blog.homeLatest;
  if (!count || !posts.length) return null;
  return (
    <section id="blog" aria-labelledby="blog-title" className="py-16 lg:py-24">
      <div className="site-container">
        <SectionHeading
          id="blog-title"
          eyebrow="Blog"
          title="Our Latest Posts"
          description="Mixing techniques, gear guides and career tips from our instructors, fresh from the booth."
        />

        <div className="mt-10 lg:mt-12">
          <Carousel
            label="Latest blog posts"
            slideClassName="basis-[85%] sm:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)] xl:basis-[calc((100%-4.5rem)/4)]"
          >
            {posts.slice(0, count).map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </Carousel>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/blog"
            className="group inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-5 text-base font-medium text-foreground shadow-xs transition hover:border-foreground hover:bg-foreground hover:text-background"
          >
            View All Posts
            <ArrowRightIcon className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
