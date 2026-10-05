"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition, type FormEvent } from "react";
import { deleteMyReview, getMyReview, saveMyReview, type MyReview } from "@/app/(learn)/courses/actions";
import type { PublicReview } from "@/lib/db/reviews";
import { useSignedIn } from "@/lib/use-signed-in";
import { StarIcon } from "./icons";
import { UserAvatar } from "./user-avatar";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function Stars({ value, className = "size-4" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex text-accent-amber" role="img" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} fill={i < Math.round(value) ? "currentColor" : "none"} className={className} />
      ))}
    </span>
  );
}

/* The course page's Reviews tab: the latest reviews, and a form for enrolled students. */
export function CourseReviews({ courseSlug, rating, total, reviews }: { courseSlug: string; rating: number; total: number; reviews: PublicReview[] }) {
  const signedIn = useSignedIn();
  const [mine, setMine] = useState<{ canReview: boolean; review: MyReview } | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    getMyReview(courseSlug).then(
      (result) => {
        if (!cancelled && result.ok) setMine(result.record);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [signedIn, courseSlug]);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-label="Student reviews">
        <div className="flex items-center gap-3">
          <p className="text-4xl font-bold tracking-tight text-foreground tabular-nums">{total ? rating.toFixed(1) : "–"}</p>
          <div>
            <Stars value={rating} />
            <p className="text-sm text-muted-foreground">{total ? `${total.toLocaleString("en-US")} reviews` : "No reviews yet"}</p>
          </div>
        </div>

        {reviews.length > 0 ? (
          <ul className="mt-8 space-y-6">
            {reviews.map((r) => (
              <li key={r.id} className="flex gap-3">
                <UserAvatar src={r.avatar} name={r.name} pixels={72} className="size-10 text-sm" />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-2 text-sm">
                    <span className="font-semibold text-foreground">{r.name}</span>
                    <Stars value={r.rating} className="size-3.5" />
                    <span className="text-muted-foreground">{dateFormat.format(new Date(r.createdAt))}</span>
                  </p>
                  {r.body && <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-foreground/85">{r.body}</p>}
                  {r.reply && (
                    <div className="mt-3 rounded-xl border-l-4 border-brand bg-brand/[0.05] px-4 py-3 text-sm">
                      <p className="font-semibold text-foreground">Reply from the instructor</p>
                      <p className="mt-1 leading-relaxed text-foreground/80">{r.reply}</p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 text-[0.9375rem] text-muted-foreground">Be the first to share what you thought of this course.</p>
        )}
      </section>

      <aside aria-label="Your review" className="h-fit rounded-2xl border border-border bg-card p-5">
        {!signedIn ? (
          <>
            <p className="font-semibold text-foreground">Taken this course?</p>
            <p className="mt-1 text-sm text-muted-foreground">Log in to leave a review and save your progress.</p>
            <Link
              href={`/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`}
              className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#18181b] px-4 text-sm font-semibold text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background"
            >
              Log in
            </Link>
          </>
        ) : mine === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !mine.canReview && !mine.review ? (
          <>
            <p className="font-semibold text-foreground">Reviews come from students</p>
            <p className="mt-1 text-sm text-muted-foreground">Start the course (play any lesson while signed in) and you can review it here.</p>
          </>
        ) : (
          <ReviewForm key={JSON.stringify(mine.review)} courseSlug={courseSlug} review={mine.review} onSaved={(review) => setMine({ canReview: true, review })} />
        )}
      </aside>
    </div>
  );
}

function ReviewForm({ courseSlug, review, onSaved }: { courseSlug: string; review: MyReview; onSaved: (review: MyReview) => void }) {
  const router = useRouter();
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [body, setBody] = useState(review?.body ?? "");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const id = useId();

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!rating) return setMessage({ tone: "error", text: "Choose a star rating." });
    start(async () => {
      const result = await saveMyReview(courseSlug, { rating, body });
      if (!result.ok) return setMessage({ tone: "error", text: result.error });
      setMessage({ tone: "ok", text: review ? "Review updated." : "Thanks! Your review is live." });
      onSaved({ rating, body: body.trim(), status: review?.status ?? "published", reply: review?.reply ?? "" });
      router.refresh();
    });
  }

  function remove() {
    start(async () => {
      const result = await deleteMyReview(courseSlug);
      if (!result.ok) return setMessage({ tone: "error", text: result.error });
      onSaved(null);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="font-semibold text-foreground">{review ? "Your review" : "Review this course"}</p>
      {review?.status === "hidden" && (
        <p className="rounded-lg bg-foreground/[0.06] px-3 py-2 text-xs text-muted-foreground">Your review was hidden by the team, so it isn&apos;t shown on the course page.</p>
      )}
      <fieldset>
        <legend className="mb-2 text-sm text-muted-foreground">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded-md p-0.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand">
              <input type="radio" name={`${id}-rating`} value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" />
              <span className="sr-only">{n} stars</span>
              <StarIcon fill={n <= rating ? "currentColor" : "none"} className="size-7 text-accent-amber" />
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor={`${id}-body`} className="mb-2 block text-sm text-muted-foreground">
          What did you think? <span className="text-xs">(optional)</span>
        </label>
        <textarea
          id={`${id}-body`}
          rows={4}
          maxLength={2000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
        />
      </div>
      {message && (
        <p role={message.tone === "error" ? "alert" : "status"} className={`text-sm ${message.tone === "error" ? "text-red-600 dark:text-red-400" : "text-brand-deep dark:text-brand"}`}>
          {message.text}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-lg bg-[#18181b] px-4 text-sm font-semibold text-white hover:bg-[#27272a] disabled:opacity-60 dark:bg-foreground dark:text-background"
        >
          {pending ? "Saving…" : review ? "Update review" : "Post review"}
        </button>
        {review && (
          <button type="button" onClick={remove} disabled={pending} className="text-sm font-medium text-muted-foreground hover:text-red-600">
            Delete
          </button>
        )}
      </div>
      {review?.reply && (
        <div className="rounded-xl border-l-4 border-brand bg-brand/[0.05] px-3 py-2 text-sm">
          <p className="font-semibold text-foreground">Reply from the instructor</p>
          <p className="mt-1 text-foreground/80">{review.reply}</p>
        </div>
      )}
    </form>
  );
}
