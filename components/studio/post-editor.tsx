"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { postCategories } from "@/lib/post-categories";
import { postChecks, type PostStatus, type StudioPost } from "@/lib/studio-blog";
import { slugify, uid, wordCount } from "@/lib/studio-courses";
import { useCollection } from "@/lib/studio-store";
import { ArrowUpRightIcon, CheckIcon } from "../icons";
import { postStatusBadge } from "./blog-manager";
import { ThumbnailPicker } from "./course-fields";
import { DescriptionEditor } from "./description-editor";
import { TagInput } from "./tag-input";
import { Field, Input, Panel, Select, Textarea, primaryButton, secondaryButton } from "./ui";

const today = () => new Date().toISOString().slice(0, 10);

export function PostEditor({ seed, postId, author }: { seed: StudioPost[]; postId?: string; author: StudioPost["author"] }) {
  const { items } = useCollection("posts", seed);
  const existing = postId ? items.find((p) => p.id === postId) : undefined;
  // Created once, so a new post keeps the same id across re-renders.
  const [fresh] = useState<StudioPost>(() => ({
    id: uid(),
    slug: "",
    title: "",
    excerpt: "",
    body: "",
    category: "",
    keywords: [],
    cover: "",
    status: "draft",
    publishAt: today(),
    author,
    updatedAt: new Date().toISOString(),
  }));

  if (postId && !existing) {
    return (
      <Panel>
        <div className="py-10 text-center">
          <p className="text-lg font-semibold text-foreground">Post not found</p>
          <p className="mt-1 text-sm text-muted-foreground">It may have been deleted, or it was created in another browser.</p>
          <Link href="/studio/blog" className={`${primaryButton} mt-5`}>
            Back to posts
          </Link>
        </div>
      </Panel>
    );
  }

  const initial = existing ?? fresh;

  return <Editor key={initial.id} seed={seed} initial={initial} isNew={!existing} />;
}

function Editor({ seed, initial, isNew }: { seed: StudioPost[]; initial: StudioPost; isNew: boolean }) {
  const router = useRouter();
  const saved = useSearchParams().get("saved");
  const savedMessages: Record<string, string> = {"published":"Post published.","scheduled":"Post scheduled.","draft":"Draft saved."};
  const { items, save } = useCollection("posts", seed);
  const [draft, setDraft] = useState(initial);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initial));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(saved && savedMessages[saved] ? { tone: "ok", text: savedMessages[saved] } : null);

  const dirty = JSON.stringify(draft) !== savedJson;
  const checks = postChecks(draft);
  const words = wordCount(draft.body);
  const slugTaken = items.some((p) => p.id !== draft.id && p.slug === draft.slug);

  const set = <K extends keyof StudioPost>(key: K, value: StudioPost[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => dirty && e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  function submit(status: PostStatus) {
    const next = { ...draft, status, slug: draft.slug || slugify(draft.title) };
    const found: Record<string, string> = {};
    if (next.title.trim().length < 10) found.title = "Write a title of at least 10 characters.";
    if (!next.slug) found.slug = "Add a URL for this post.";
    else if (slugTaken) found.slug = "Another post already uses this URL.";
    if (status !== "draft") {
      if (!next.category) found.category = "Choose a category.";
      if (next.excerpt.trim().length < 50) found.excerpt = "Write a summary of at least 50 characters for search results.";
      if (wordCount(next.body) < 100) found.body = "Posts need at least 100 words before they go live.";
      if (!next.cover) found.cover = "Add a cover image.";
      if (status === "scheduled" && next.publishAt <= today()) found.publishAt = "Pick a future date, or publish now.";
    }
    setErrors(found);
    if (Object.keys(found).length) {
      setMessage({ tone: "error", text: "Fix the highlighted fields to continue." });
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    if (status === "published" && initial.status !== "published") next.publishAt = today();
    try {
      save(next);
      setDraft(next);
      setSavedJson(JSON.stringify(next));
      setMessage({
        tone: "ok",
        text: status === "published" ? "Post published." : status === "scheduled" ? `Scheduled for ${next.publishAt}.` : "Draft saved.",
      });
      if (isNew) router.replace(`/studio/blog/${next.id}/edit?saved=${status}`);
    } catch (error) {
      setMessage({ tone: "error", text: (error as Error).message });
    }
  }

  const publishLabel = draft.status === "published" ? "Update post" : "Publish now";

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-6">
        {message && (
          <p
            role={message.tone === "error" ? "alert" : "status"}
            className={`rounded-xl border px-4 py-3 text-sm ${
              message.tone === "error" ? "border-red-500/30 bg-red-500/[0.07] text-red-700 dark:text-red-300" : "border-brand/25 bg-brand/[0.07] text-foreground"
            }`}
          >
            {message.text}
          </p>
        )}
        <Panel>
          <div className="space-y-6">
            <Field label="Title" htmlFor="title" required error={errors.title} aside={<Counter n={draft.title.length} ideal={[30, 65]} />}>
              <Input
                id="title"
                value={draft.title}
                maxLength={120}
                autoFocus={isNew}
                onChange={(e) => {
                  set("title", e.target.value);
                  if (!slugTouched) set("slug", slugify(e.target.value));
                }}
                placeholder="e.g. How to Beatmatch by Ear: A Beginner's Guide"
                aria-invalid={errors.title ? true : undefined}
                className="h-12 text-lg font-semibold"
              />
            </Field>
            <Field label="URL" htmlFor="slug" required error={errors.slug ?? (slugTaken ? "Another post already uses this URL." : undefined)}>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-xl border border-r-0 border-border bg-muted px-3 text-sm text-muted-foreground">/blog/</span>
                <Input
                  id="slug"
                  value={draft.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", slugify(e.target.value));
                  }}
                  aria-invalid={errors.slug || slugTaken ? true : undefined}
                  className="rounded-l-none"
                />
              </div>
            </Field>
            <Field label="Summary" htmlFor="excerpt" required error={errors.excerpt} aside={<Counter n={draft.excerpt.length} ideal={[70, 160]} />} hint="Shown under the title, on blog cards and in Google results.">
              <Textarea id="excerpt" rows={3} maxLength={220} value={draft.excerpt} onChange={(e) => set("excerpt", e.target.value)} aria-invalid={errors.excerpt ? true : undefined} />
            </Field>
            <Field
              label="Content"
              htmlFor="body"
              required
              error={errors.body}
              hint={`${words} words · about ${Math.max(1, Math.ceil(words / 225))} min read. Use ## headings, lists and links to other posts and courses.`}
            >
              <DescriptionEditor id="body" value={draft.body} onChange={(v) => set("body", v)} invalid={!!errors.body} />
            </Field>
          </div>
        </Panel>
      </div>

      <aside className="min-w-0 space-y-6 xl:sticky xl:top-24 xl:self-start">
        <Panel title="Publish" actions={postStatusBadge(draft.status)}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{dirty ? "You have unsaved changes." : "All changes saved."}</p>
            <Field label="Publish date" htmlFor="publishAt" error={errors.publishAt} hint="Pick a future date to schedule the post.">
              <Input id="publishAt" type="date" value={draft.publishAt} onChange={(e) => set("publishAt", e.target.value)} aria-invalid={errors.publishAt ? true : undefined} className="dark:[color-scheme:dark]" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => submit("draft")} className={secondaryButton}>
                {draft.status === "draft" ? "Save draft" : "Unpublish"}
              </button>
              {draft.publishAt > today() && draft.status !== "published" ? (
                <button type="button" onClick={() => submit("scheduled")} className={primaryButton}>
                  Schedule
                </button>
              ) : (
                <button type="button" onClick={() => submit("published")} className={primaryButton}>
                  {publishLabel}
                </button>
              )}
            </div>
            {draft.status === "published" && (
              <Link href={`/blog/${draft.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                View on site <ArrowUpRightIcon className="size-3.5" />
              </Link>
            )}
          </div>
        </Panel>

        <Panel title="Organize">
          <div className="space-y-4">
            <Field label="Category" htmlFor="category" required error={errors.category}>
              <Select id="category" value={draft.category} onChange={(e) => set("category", e.target.value as StudioPost["category"])} aria-invalid={errors.category ? true : undefined}>
                <option value="">Select a category</option>
                {postCategories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Keywords" htmlFor="keywords" hint="Press Enter or comma after each. Used for search and SEO.">
              <TagInput id="keywords" tags={draft.keywords} onChange={(v) => set("keywords", v)} placeholder="e.g. beatmatching" />
            </Field>
          </div>
        </Panel>

        <Panel title="Cover image">
          <ThumbnailPicker id="cover" value={draft.cover} onChange={(src) => set("cover", src)} invalid={!!errors.cover} />
          {errors.cover && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.cover}</p>}
        </Panel>

        <Panel title="Search preview">
          <div className="rounded-xl border border-border p-4">
            <p className="truncate text-xs text-muted-foreground">ultimatedeejays.com › blog › {draft.slug || "your-post"}</p>
            <p className="mt-1 line-clamp-2 text-lg leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">{draft.title || "Your post title"} | Ultimate Deejays</p>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{draft.excerpt || "Your summary appears here in search results."}</p>
          </div>
          <ul className="mt-4 space-y-2">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-2 text-sm">
                <span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${c.done ? "bg-brand text-white" : "border-2 border-foreground/20"}`}>
                  {c.done && <CheckIcon className="size-3" strokeWidth={3} />}
                </span>
                <span className={c.done ? "text-muted-foreground" : "text-foreground"}>{c.label}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </aside>
    </div>
  );
}

function Counter({ n, ideal }: { n: number; ideal: [number, number] }) {
  const good = n >= ideal[0] && n <= ideal[1];
  return (
    <span className={`text-xs tabular-nums ${n === 0 ? "text-muted-foreground" : good ? "text-brand-deep dark:text-brand" : "text-[#9a6400] dark:text-accent-amber"}`}>
      {n} · ideal {ideal[0]}–{ideal[1]}
    </span>
  );
}
