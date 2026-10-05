import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/article-body";
import { ArticleToc } from "@/components/article-toc";
import { ArrowRightIcon, ChevronRightIcon, HomeIcon } from "@/components/icons";
import { Newsletter } from "@/components/newsletter";
import { PostCard } from "@/components/post-card";
import { ReadingProgress } from "@/components/reading-progress";
import { ShareButtons } from "@/components/share-buttons";
import { tableOfContents } from "@/lib/articles";
import type { Instructor } from "@/lib/content";
import { getLivePost, getLivePosts } from "@/lib/db/posts";
import { getSiteSettings } from "@/lib/db/settings";
import { markdownToBlocks } from "@/lib/markdown";
import { siteName, siteUrl } from "@/lib/site";

// Live posts are built ahead of time; posts published later render on first visit.
export async function generateStaticParams() {
  return (await getLivePosts()).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = await getLivePost((await params).slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      siteName,
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      images: [{ url: post.image, width: 1440, height: 1008, alt: post.title }],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt, images: [post.image] },
  };
}

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const [post, posts, settings] = await Promise.all([getLivePost((await params).slug), getLivePosts(), getSiteSettings()]);
  if (!post) notFound();

  const blog = settings.blog;
  const article = { excerpt: post.excerpt, body: markdownToBlocks(post.body) };
  const toc = tableOfContents(article);
  const others = posts.filter((p) => p.slug !== post.slug);
  const related = [
    ...others.filter((p) => p.category.slug === post.category.slug),
    ...others.filter((p) => p.category.slug !== post.category.slug),
  ].slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: new URL(post.image, siteUrl).toString(),
    datePublished: post.publishedAt,
    author: { "@type": "Person", name: post.author.name },
    publisher: { "@type": "Organization", name: siteName },
    mainEntityOfPage: new URL(`/blog/${post.slug}`, siteUrl).toString(),
  };

  return (
    <main className="flex-1">
      {blog.showReadingProgress && <ReadingProgress targetId="article-content" />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <article>
        <header className="site-container pt-6 sm:pt-10">
          <div className="mx-auto max-w-[51.25rem] text-center">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <li>
                  <Link href="/" className="flex items-center text-foreground transition hover:text-brand">
                    <HomeIcon className="size-4" />
                    <span className="sr-only">Home</span>
                  </Link>
                </li>
                <li aria-hidden="true">
                  <ChevronRightIcon className="size-3.5" />
                </li>
                <li>
                  <Link href="/blog" className="transition hover:text-brand">
                    Blog
                  </Link>
                </li>
                <li aria-hidden="true">
                  <ChevronRightIcon className="size-3.5" />
                </li>
                <li>
                  <Link href={`/blog?category=${post.category.slug}`} className="transition hover:text-brand">
                    {post.category.name}
                  </Link>
                </li>
              </ol>
            </nav>

            <h1 className="mt-6 text-[2rem] leading-[1.15] font-bold tracking-tight text-balance text-foreground sm:text-[2.75rem]">
              {post.title}
            </h1>
            <p className="mx-auto mt-5 max-w-[42.5rem] text-lg leading-relaxed text-pretty text-muted-foreground">
              {post.excerpt}
            </p>

            <div className="mt-7 flex flex-col items-center gap-3 text-sm text-muted-foreground sm:flex-row sm:justify-center sm:gap-4">
              <span className="flex items-center gap-2.5">
                <Image
                  src={post.author.image}
                  alt=""
                  width={80}
                  height={80}
                  className="size-9 rounded-full object-cover object-top"
                />
                <span>
                  By <span className="font-medium text-foreground">{post.author.name}</span>
                </span>
              </span>
              <span aria-hidden="true" className="hidden size-1 rounded-full bg-foreground/25 sm:block" />
              <span className="flex items-center gap-4">
                <time dateTime={post.publishedAt}>{dateFormat.format(new Date(post.publishedAt))}</time>
                <span aria-hidden="true" className="size-1 rounded-full bg-foreground/25" />
                <span>{post.readMinutes} min read</span>
              </span>
            </div>
          </div>

          <div className="relative mx-auto mt-10 aspect-[3/2] max-w-[68.75rem] overflow-hidden rounded-3xl bg-muted sm:aspect-[16/9]">
            <Image
              src={post.image}
              alt=""
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 1180px) 1100px, 94vw"
              className="object-cover"
            />
          </div>
        </header>

        <div className="site-container pt-12 pb-20 lg:pt-16 lg:pb-24">
          <div className="mx-auto grid max-w-[68.75rem] gap-12 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-16">
            <div className="min-w-0">
              {/* Small screens get the contents list inline and collapsible */}
              <details className="group mx-auto mb-10 max-w-[43.75rem] rounded-2xl border border-border bg-card px-5 py-4 lg:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                  On this page
                  <ChevronRightIcon className="size-4 transition group-open:rotate-90" />
                </summary>
                <ol className="mt-3 space-y-2 border-t border-border pt-3">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a href={`#${item.id}`} className="text-[0.9375rem] text-muted-foreground hover:text-brand">
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>

              <div id="article-content" className="mx-auto max-w-[43.75rem]">
                <ArticleBody blocks={article.body} />
              </div>

              <footer className="mx-auto mt-14 max-w-[43.75rem] space-y-10">
                {blog.showShare && (
                  <div className="flex flex-col gap-4 border-y border-border py-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-semibold text-foreground">Share this article</p>
                    <ShareButtons title={post.title} />
                  </div>
                )}
                {blog.showAuthorBox && <AuthorCard author={post.author} />}
              </footer>
            </div>

            <aside aria-label="Article tools" className="hidden lg:block">
              <div className="sticky top-28 space-y-8">
                <ArticleToc items={toc} />
                <div className="relative isolate overflow-hidden rounded-2xl bg-brand-deep p-6 text-white">
                  <div
                    aria-hidden="true"
                    className="absolute -top-10 -right-10 -z-10 size-40 rounded-full bg-white/10 blur-2xl"
                  />
                  <p className="text-lg leading-snug font-semibold">Turn tips into real skills</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">
                    Step-by-step video courses from working DJs, with feedback on your mixes.
                  </p>
                  <Link
                    href="/courses"
                    className="mt-5 inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-semibold text-neutral-900 transition hover:bg-white/90"
                  >
                    Browse Courses
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>

      {blog.showRelated && related.length > 0 && (
      <section aria-labelledby="related-title" className="border-t border-border bg-cream py-20 lg:py-24">
        <div className="site-container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-base font-medium text-brand">Keep reading</p>
              <h2 id="related-title" className="mt-1 text-[1.75rem] leading-tight font-bold tracking-tight text-foreground sm:text-[2rem]">
                More from the blog
              </h2>
            </div>
            <Link href="/blog" className="group inline-flex items-center gap-2 font-medium text-brand hover:text-brand-deep">
              View all posts
              <ArrowRightIcon className="size-4 transition group-hover:translate-x-1" />
            </Link>
          </div>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <li key={p.slug}>
                <PostCard post={p} sizes="(min-width: 1024px) 400px, (min-width: 640px) 48vw, 92vw" />
              </li>
            ))}
          </ul>
        </div>
      </section>
      )}

      {blog.showNewsletter && (
        <div className="pt-20 lg:pt-28">
          <Newsletter />
        </div>
      )}
    </main>
  );
}

function AuthorCard({ author }: { author: Instructor }) {
  const firstName = author.name.split(" ")[0];

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-black/[0.06] bg-card p-6 shadow-[0_8px_30px_-6px_rgb(0_0_0/0.08)] sm:flex-row dark:border-white/10">
      <Image
        src={author.image}
        alt={`Portrait of ${author.name}`}
        width={144}
        height={144}
        className="size-18 shrink-0 rounded-full object-cover object-top"
      />
      <div>
        <p className="text-sm text-muted-foreground">Written by</p>
        <p className="text-lg font-semibold text-foreground">{author.name}</p>
        <p className="text-sm text-brand">{author.specialty} Instructor</p>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">{author.bio}</p>
        <Link
          href={`/blog?q=${encodeURIComponent(author.name)}`}
          className="group mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-deep"
        >
          More posts by {firstName}
          <ArrowRightIcon className="size-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
