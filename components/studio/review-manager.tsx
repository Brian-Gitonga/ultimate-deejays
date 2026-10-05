"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { deleteReview, saveReview } from "@/app/(studio)/studio/reviews/actions";
import type { StudioReview } from "@/lib/reviews";
import { useServerCollection } from "@/lib/studio-store";
import { ArrowUpRightIcon, EyeIcon, EyeOffIcon, MessageIcon, StarIcon, TrashIcon } from "../icons";
import { UserAvatar } from "../user-avatar";
import { Drawer } from "./drawer";
import { ConfirmDialog, ManageTable, RowMenu, useToast } from "./manage-table";
import { Field, Kpi, Textarea, primaryButton, secondaryButton } from "./ui";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex text-accent-amber" role="img" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} fill={i < value ? "currentColor" : "none"} className="size-3.5" />
      ))}
    </span>
  );
}

/*
 * Studio → Reviews: every course review. Reply publicly (shown under the
 * review on the course page), hide reviews that break the rules, or delete them.
 */
export function ReviewManager({ seed }: { seed: StudioReview[] }) {
  const { items, save, remove } = useServerCollection(seed, { save: saveReview, remove: deleteReview });
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<StudioReview | null>(null);
  const { show, toast } = useToast();
  const open = items.find((r) => r.id === openId) ?? null;

  const published = items.filter((r) => r.status === "published");
  const average = published.length ? published.reduce((s, r) => s + r.rating, 0) / published.length : 0;
  const needsReply = items.filter((r) => !r.reply && r.status === "published");
  const low = published.filter((r) => r.rating <= 3);

  function toggleHidden(r: StudioReview) {
    const status = r.status === "hidden" ? "published" : "hidden";
    save({ ...r, status }).then((saved) => saved && show(status === "hidden" ? "Review hidden from the course page" : "Review shown on the course page"));
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon={StarIcon} label="Average rating" value={published.length ? average.toFixed(1) : "–"} note={`${published.length} shown on the site`} />
        <Kpi icon={MessageIcon} label="Waiting for a reply" value={String(needsReply.length)} />
        <Kpi icon={StarIcon} label="3 stars or fewer" value={String(low.length)} note="Worth a personal reply" />
        <Kpi icon={EyeOffIcon} label="Hidden" value={String(items.length - published.length)} />
      </ul>

      <ManageTable
        title="Reviews"
        items={items}
        getId={(r) => r.id}
        minWidth="52rem"
        searchText={(r) => [r.name, r.courseTitle, r.body]}
        searchPlaceholder="Search student, course or text"
        initialSort={{ key: "date", dir: -1 }}
        onRowClick={(r) => setOpenId(r.id)}
        tabs={[
          { key: "all", label: "All", test: () => true },
          { key: "reply", label: "Needs reply", test: (r) => !r.reply && r.status === "published" },
          { key: "low", label: "3★ or fewer", test: (r) => r.rating <= 3 },
          { key: "hidden", label: "Hidden", test: (r) => r.status === "hidden" },
        ]}
        columns={[
          {
            key: "student",
            header: "Student",
            sort: (r) => r.name,
            render: (r) => (
              <span className="flex items-center gap-3">
                <UserAvatar src={r.avatar} name={r.name} pixels={64} className="size-8 text-xs" />
                <span className="font-medium text-foreground">
                  {r.name}
                  {r.isDemo && <span className="ml-2 rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[0.6875rem] font-normal text-muted-foreground">demo</span>}
                </span>
              </span>
            ),
          },
          { key: "rating", header: "Rating", sort: (r) => r.rating, render: (r) => <Stars value={r.rating} /> },
          {
            key: "review",
            header: "Review",
            render: (r) => (
              <span className="block max-w-sm">
                <span className="block truncate text-xs font-medium text-muted-foreground">{r.courseTitle}</span>
                <span className="line-clamp-2 text-sm text-foreground/85">{r.body || <em className="text-muted-foreground">No text, just a rating</em>}</span>
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            sort: (r) => (r.status === "hidden" ? 2 : r.reply ? 1 : 0),
            render: (r) =>
              r.status === "hidden" ? (
                <span className="text-sm text-muted-foreground">Hidden</span>
              ) : r.reply ? (
                <span className="text-sm text-brand-deep dark:text-brand">Replied</span>
              ) : (
                <span className="text-sm font-medium text-[#b37400] dark:text-accent-amber">Needs reply</span>
              ),
          },
          { key: "date", header: "Date", sort: (r) => r.createdAt, render: (r) => <span className="whitespace-nowrap text-muted-foreground">{dateFormat.format(new Date(r.createdAt))}</span> },
        ]}
        actions={(r) => (
          <RowMenu
            label={`Actions for ${r.name}'s review`}
            items={[
              { label: r.reply ? "Edit reply" : "Reply", icon: MessageIcon, onSelect: () => setOpenId(r.id) },
              { label: r.status === "hidden" ? "Show on course page" : "Hide from course page", icon: r.status === "hidden" ? EyeIcon : EyeOffIcon, onSelect: () => toggleHidden(r) },
              !!r.courseSlug && { label: "View course", icon: ArrowUpRightIcon, href: `/courses/${r.courseSlug}`, external: true },
              { label: "Delete", icon: TrashIcon, danger: true, onSelect: () => setConfirm(r) },
            ]}
          />
        )}
        empty={<p className="text-muted-foreground">No reviews yet. Students can review a course once they&apos;ve started it.</p>}
      />

      {open && (
        <ReviewDrawer
          key={open.id}
          review={open}
          onClose={() => setOpenId(null)}
          onToggle={() => toggleHidden(open)}
          onReply={(reply) =>
            save({ ...open, reply }).then((saved) => {
              if (!saved) return;
              setOpenId(null);
              show(reply ? "Reply posted on the course page" : "Reply removed");
            })
          }
        />
      )}
      {confirm && (
        <ConfirmDialog
          title="Delete this review?"
          body="It's removed from the course page and the rating is recalculated. Hiding it instead keeps a record."
          confirmLabel="Delete review"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const review = confirm;
            setConfirm(null);
            setOpenId(null);
            remove(review.id).then((done) => done && show("Review deleted"));
          }}
        />
      )}
      {toast}
    </>
  );
}

function ReviewDrawer({ review, onClose, onToggle, onReply }: { review: StudioReview; onClose: () => void; onToggle: () => void; onReply: (reply: string) => void }) {
  const titleId = useId();
  const [reply, setReply] = useState(review.reply);

  return (
    <Drawer
      titleId={titleId}
      onClose={onClose}
      header={
        <>
          <h2 id={titleId} className="text-lg font-semibold text-foreground">
            {review.name}&apos;s review
          </h2>
          <p className="text-sm text-muted-foreground">
            {review.courseTitle} · {dateFormat.format(new Date(review.createdAt))}
          </p>
        </>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onToggle} className={secondaryButton}>
            {review.status === "hidden" ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
            {review.status === "hidden" ? "Show" : "Hide"}
          </button>
          <button type="button" disabled={reply.trim() === review.reply} onClick={() => onReply(reply.trim())} className={primaryButton}>
            {review.reply ? "Update reply" : "Post reply"}
          </button>
        </div>
      }
    >
      <div className="rounded-xl border border-border p-4">
        <Stars value={review.rating} />
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-foreground">{review.body || <em className="text-muted-foreground">No text, just a rating.</em>}</p>
        {review.status === "hidden" && <p className="mt-3 text-xs font-medium text-muted-foreground">Hidden: not shown on the course page or counted in its rating.</p>}
      </div>
      <Field label="Your public reply" htmlFor="review-reply" hint="Shown under the review on the course page, as a reply from the instructor. Leave empty to remove it.">
        <Textarea id="review-reply" rows={6} maxLength={2000} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Thanks for the review! …" />
      </Field>
      {review.courseSlug && (
        <Link href={`/courses/${review.courseSlug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
          View the course page <ArrowUpRightIcon className="size-3.5" />
        </Link>
      )}
    </Drawer>
  );
}
