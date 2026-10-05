"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { postCategories } from "@/lib/post-categories";
import { uid } from "@/lib/studio-courses";
import type { PostStatus, StudioPost } from "@/lib/studio-blog";
import { deletePost, savePost } from "@/app/(studio)/studio/blog/actions";
import { useServerCollection } from "@/lib/studio-store";
import { ArrowUpRightIcon, CloseIcon, PencilIcon, PlusIcon } from "../icons";
import { ConfirmDialog, ManageTable, RowMenu, useToast } from "./manage-table";
import { StatusBadge } from "./status";
import { primaryButton } from "./ui";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
export const postStatusBadge = (status: PostStatus) =>
  status === "published" ? <StatusBadge status="published" /> : status === "scheduled" ? <StatusBadge status="review" label="Scheduled" /> : <StatusBadge status="draft" />;
const categoryName = (slug: string) => postCategories.find((c) => c.slug === slug)?.name ?? "Uncategorized";
const readMinutes = (body: string) => Math.max(1, Math.ceil(body.trim().split(/\s+/).filter(Boolean).length / 225));

export function BlogManager({ seed }: { seed: StudioPost[] }) {
  const { items, save, remove } = useServerCollection(seed, { save: savePost, remove: deletePost });
  const [confirm, setConfirm] = useState<StudioPost | null>(null);
  const { show, toast } = useToast();

  return (
    <>
      <ManageTable
        title="All posts"
        items={items}
        getId={(p) => p.id}
        searchText={(p) => [p.title, p.author.name, categoryName(p.category), ...p.keywords]}
        searchPlaceholder="Search title, author, keyword"
        initialSort={{ key: "date", dir: -1 }}
        tabs={[
          { key: "all", label: "All", test: () => true },
          { key: "published", label: "Published", test: (p) => p.status === "published" },
          { key: "scheduled", label: "Scheduled", test: (p) => p.status === "scheduled" },
          { key: "draft", label: "Drafts", test: (p) => p.status === "draft" },
        ]}
        columns={[
          {
            key: "title",
            header: "Post",
            sort: (p) => p.title,
            render: (p) => (
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-muted">
                  {p.cover && <Image src={p.cover} alt="" fill sizes="72px" unoptimized={p.cover.startsWith("data:")} className="object-cover" />}
                </div>
                <div className="min-w-0 max-w-[26rem]">
                  <Link href={`/studio/blog/${p.id}/edit`} className="line-clamp-2 font-medium text-foreground hover:text-brand">
                    {p.title || "Untitled post"}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">/blog/{p.slug}</p>
                </div>
              </div>
            ),
          },
          {
            key: "author",
            header: "Author",
            sort: (p) => p.author.name,
            render: (p) => (
              <span className="flex items-center gap-2">
                <Image src={p.author.image} alt="" width={56} height={56} className="size-7 shrink-0 rounded-full object-cover object-top" />
                <span className="leading-tight">
                  <span className="block text-foreground">{p.author.name}</span>
                  <span className="block text-xs text-muted-foreground">{p.author.email}</span>
                </span>
              </span>
            ),
          },
          { key: "category", header: "Category", sort: (p) => categoryName(p.category), render: (p) => <span className="text-foreground">{categoryName(p.category)}</span> },
          { key: "status", header: "Status", sort: (p) => p.status, render: (p) => postStatusBadge(p.status) },
          { key: "read", header: "Read time", align: "right", sort: (p) => readMinutes(p.body), render: (p) => <span className="text-muted-foreground">{readMinutes(p.body)} min</span> },
          {
            key: "date",
            header: "Publish date",
            align: "right",
            sort: (p) => p.publishAt,
            render: (p) => <span className="whitespace-nowrap text-muted-foreground">{p.publishAt ? dateFormat.format(new Date(p.publishAt)) : "—"}</span>,
          },
        ]}
        actions={(p) => (
          <RowMenu
            label={`Actions for ${p.title}`}
            items={[
              { label: "Edit post", icon: PencilIcon, href: `/studio/blog/${p.id}/edit` },
              p.status === "published" && { label: "View on site", icon: ArrowUpRightIcon, href: `/blog/${p.slug}`, external: true },
              {
                label: "Duplicate",
                icon: PlusIcon,
                onSelect: () => {
                  const id = uid();
                  save({ ...p, id, slug: `${p.slug}-copy-${id.slice(0, 4)}`, title: `${p.title} (copy)`, status: "draft" }).then(
                    (saved) => saved && show("Duplicated as a draft"),
                  );
                },
              },
              { label: "Delete", icon: CloseIcon, danger: true, onSelect: () => setConfirm(p) },
            ]}
          />
        )}
        empty={
          <>
            <p className="text-lg font-semibold text-foreground">No posts yet</p>
            <Link href="/studio/blog/new" className={`${primaryButton} mt-4`}>
              <PlusIcon className="size-4" /> Write a post
            </Link>
          </>
        }
      />
      {confirm && (
        <ConfirmDialog
          title="Delete this post?"
          body={
            <>
              <span className="font-medium text-foreground">{confirm.title}</span> will be removed{confirm.status === "published" ? " from the blog" : ""}. This can&apos;t be undone.
            </>
          }
          confirmLabel="Delete post"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const post = confirm;
            setConfirm(null);
            remove(post.id).then((done) => done && show(`Deleted: ${post.title}`));
          }}
        />
      )}
      {toast}
    </>
  );
}
