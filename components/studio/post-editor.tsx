"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { postCategories } from "@/lib/post-categories";
import { postChecks, type PostStatus, type StudioPost } from "@/lib/studio-blog";
import { savePost } from "@/app/(studio)/studio/blog/actions";
import { slugify, uid, wordCount, type InstructorOption } from "@/lib/studio-courses";
import { ArrowUpRightIcon, CheckIcon } from "../icons";
import { postStatusBadge } from "./blog-manager";
import { InstructorSelect, ThumbnailPicker } from "./course-fields";
import { DescriptionEditor } from "./description-editor";
import { TagInput } from "./tag-input";
import { Field, Input, Panel, Select, Textarea, primaryButton, secondaryButton } from "./ui";

const today = () => new Date().toISOString().slice(0, 10);

export function PostEditor({
  post,
  missing = false,
  authors,
  defaultCategory,
  takenSlugs,
}: {
  post: StudioPost | null;
  missing?: boolean;
  authors: InstructorOption[];
  /** Studio → Settings → Blog → default category for new posts */
  defaultCategory: string;
  takenSlugs: string[];
}) {
  // Created once, so a new post keeps the same temporary id across re-renders.
  const [fresh] = useState<StudioPost>(() => {
    const author = authors[0];
    return {
      id: uid(),
      slug: "",
      title: "",
      excerpt: "",
      body: "",
      category: (postCategories.find((c) => c.slug === defaultCategory)?.slug ?? "") as StudioPost["category"],
      keywords: [],
      cover: "",
      status: "draft",
      publishAt: today(),
      authorId: author?.id ?? null,
      author: author ? { name: author.name, email: author.email, image: author.image } : { name: "Ultimate Deejays", email: "", image: "" },
      updatedAt: new Date().toISOString(),
    };
  });

  if (missing) {
    return (
      <Panel>
        <div className="py-10 text-center">
          <p className="text-lg font-semibold text-foreground">Post not found</p>
          <p className="mt-1 text-sm text-muted-foreground">It may have been deleted. Check Studio → Blog.</p>
          <Link href="/studio/blog" className={`${primaryButton} mt-5`}>
            Back to posts
          </Link>
        </div>
      </Panel>
    );
  }

  const initial = post ?? fresh;
  return <Editor key={initial.id} initial={initial} isNew={!post} authors={authors} takenSlugs={takenSlugs} />;
}

function Editor({ initial, isNew, authors, takenSlugs }: { initial: StudioPost; isNew: boolean; authors: InstructorOption[]; takenSlugs: string[] }) {
  const router = useRouter();
  const saved = useSearchParams().get("saved");
  const savedMessages: Record<string, string> = { published: "Post published.", scheduled: "Post scheduled.", draft: "Draft saved." };
  const [draft, setDraft] = useState(initial);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initial));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(saved && savedMessages[saved] ? { tone: "ok", text: savedMessages[saved] } : null);

  const dirty = JSON.stringify(draft) !== savedJson;
  const checks = postChecks(draft);
  const words = wordCount(draft.body);
  const slugTaken = takenSlugs.includes(draft.slug);

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

  async function submit(status: PostStatus) {
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

    setBusy(true);
    const result = await savePost(next).catch(() => ({ ok: false as const, error: "We couldn't reach the server. Your changes are kept here; try again." }));
    setBusy(false);
    if (!result.ok) return setMessage({ tone: "error", text: result.error });

    if (isNew) return router.replace(`/studio/blog/${result.record.id}/edit?saved=${status}`);
    setDraft(result.record);
    setSavedJson(JSON.stringify(result.record));
    setMessage({
      tone: "ok",
      text: status === "published" ? "Post published." : status === "scheduled" ? `Scheduled for ${next.publishAt}.` : "Draft saved.",
    });
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
              <button type="button" disabled={busy} onClick={() => submit("draft")} className={secondaryButton}>
                {draft.status === "draft" ? "Save draft" : "Unpublish"}
              </button>
              {draft.publishAt > today() && draft.status !== "published" ? (
                <button type="button" disabled={busy} onClick={() => submit("scheduled")} className={primaryButton}>
                  Schedule
                </button>
              ) : (
                <button type="button" disabled={busy} onClick={() => submit("published")} className={primaryButton}>
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
            <Field label="Author" htmlFor="author" hint="Shown on the post with their photo and bio.">
              <InstructorSelect
                id="author"
                value={draft.authorId}
                options={authors}
                onChange={(option) =>
                  setDraft((d) => ({
                    ...d,
                    authorId: option?.id ?? null,
                    author: option ? { name: option.name, email: option.email, image: option.image } : { name: "Ultimate Deejays", email: "", image: "" },
                  }))
                }
              />
            </Field>
            <Field label="Keywords" htmlFor="keywords" hint="Press Enter or comma after each. Used for search and SEO.">
              <TagInput id="keywords" tags={draft.keywords} onChange={(v) => set("keywords", v)} placeholder="e.g. beatmatching" />
            </Field>
          </div>
        </Panel>

        <Panel title="Cover image">
          <ThumbnailPicker id="cover" folder="blog" size={{ width: 1440, height: 1008 }} value={draft.cover} onChange={(src) => set("cover", src)} invalid={!!errors.cover} />
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
