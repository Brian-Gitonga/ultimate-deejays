"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { saveChallenge } from "@/app/(studio)/studio/challenges/actions";
import { inspectYouTube } from "@/app/(studio)/studio/courses/actions";
import { challengeTypes, type Difficulty, type Inspiration, type Winner } from "@/lib/challenges";
import { youtubeId } from "@/lib/curriculum";
import { challengeProblems, challengeState, type ChallengeEntry, type StudioChallenge } from "@/lib/studio-challenges";
import { slugify, uid } from "@/lib/studio-courses";
import { ArrowUpRightIcon, CloseIcon, PlusIcon } from "../icons";
import { ChallengeEntries } from "./challenge-entries";
import { ChallengeStateBadge } from "./challenge-manager";
import { ThumbnailPicker } from "./course-fields";
import { ListEditor } from "./list-editor";
import { Field, Input, Panel, Select, Textarea, ghostIconButton, inputClass, primaryButton, secondaryButton } from "./ui";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const inDays = (n: number) => iso(new Date(Date.now() + n * 86_400_000));
const avatars = [1, 2, 3, 4, 5].map((n) => `/images/students/student-${n}.jpg`);

export function ChallengeEditor({
  challenge,
  missing = false,
  entries,
  takenSlugs,
}: {
  challenge: StudioChallenge | null;
  missing?: boolean;
  entries: ChallengeEntry[];
  takenSlugs: string[];
}) {
  const [fresh] = useState<StudioChallenge>(() => ({
    id: uid(),
    slug: "",
    title: "",
    tagline: "",
    type: "scratch",
    difficulty: "Beginner",
    opens: inDays(7),
    closes: inDays(37),
    image: "",
    entries: 0,
    prize: "",
    brief: "",
    rules: ["Record in one continuous take.", "Show your hands and gear in the video.", "Upload to YouTube (public or unlisted) and submit the link."],
    judging: [
      { label: "Technique", weight: 50 },
      { label: "Musicality", weight: 30 },
      { label: "Creativity", weight: 20 },
    ],
    inspiration: [],
    published: false,
    updatedAt: new Date().toISOString(),
  }));

  if (missing) {
    return (
      <Panel>
        <div className="py-10 text-center">
          <p className="text-lg font-semibold text-foreground">Challenge not found</p>
          <Link href="/studio/challenges" className={`${primaryButton} mt-5`}>
            Back to challenges
          </Link>
        </div>
      </Panel>
    );
  }

  const initial = challenge ?? fresh;
  return <Editor key={initial.id} initial={initial} isNew={!challenge} entries={entries} takenSlugs={takenSlugs} />;
}

function Editor({ initial, isNew, entries, takenSlugs }: { initial: StudioChallenge; isNew: boolean; entries: ChallengeEntry[]; takenSlugs: string[] }) {
  const router = useRouter();
  const saved = useSearchParams().get("saved");
  const savedMessages: Record<string, string> = { published: "Challenge published.", draft: "Saved as a draft." };
  const [draft, setDraft] = useState(initial);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initial));
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(saved && savedMessages[saved] ? { tone: "ok", text: savedMessages[saved] } : null);

  const dirty = JSON.stringify(draft) !== savedJson;
  const problems = challengeProblems(draft);
  const slugTaken = takenSlugs.includes(draft.slug || slugify(draft.title));
  if (slugTaken) problems.slug = "Another challenge already uses this URL.";
  const err = (key: string) => (showErrors ? problems[key] : undefined);
  const state = challengeState(draft);
  const total = draft.judging.reduce((s, j) => s + (Number(j.weight) || 0), 0);

  const set = <K extends keyof StudioChallenge>(key: K, value: StudioChallenge[K]) => setDraft((d) => ({ ...d, [key]: value }));

  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => dirty && e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  async function submit(published: boolean) {
    const next = { ...draft, published, slug: draft.slug || slugify(draft.title) };
    // Drafts only need a title; publishing needs everything.
    const blocking = published ? problems : Object.fromEntries(Object.entries(problems).filter(([k]) => k === "title" || k === "slug"));
    if (Object.keys(blocking).length) {
      setShowErrors(true);
      setMessage({ tone: "error", text: `Fix ${Object.keys(blocking).length} ${Object.keys(blocking).length === 1 ? "issue" : "issues"} to ${published ? "publish" : "save"}.` });
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    setBusy(true);
    const result = await saveChallenge(next).catch(() => ({ ok: false as const, error: "We couldn't reach the server. Your changes are kept here; try again." }));
    setBusy(false);
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    if (isNew) return router.replace(`/studio/challenges/${result.record.id}/edit?saved=${published ? "published" : "draft"}`);
    setDraft(result.record);
    setSavedJson(JSON.stringify(result.record));
    setMessage({ tone: "ok", text: published ? `Published. It shows as "${challengeState(result.record)}" on the site.` : "Saved as a draft." });
  }

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

        <Panel title="Basics">
          <div className="space-y-5">
            <Field label="Title" htmlFor="title" required error={err("title")}>
              <Input id="title" value={draft.title} maxLength={60} autoFocus={isNew} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Baby Scratch Bootcamp" aria-invalid={err("title") ? true : undefined} />
            </Field>
            <Field label="Tagline" htmlFor="tagline" required error={err("tagline")} hint="One short, punchy line for cards.">
              <Input id="tagline" value={draft.tagline} maxLength={70} onChange={(e) => set("tagline", e.target.value)} placeholder="e.g. One scratch, 60 seconds, total control." aria-invalid={err("tagline") ? true : undefined} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Type" htmlFor="type" required>
                <Select id="type" value={draft.type} onChange={(e) => set("type", e.target.value as StudioChallenge["type"])}>
                  {challengeTypes.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Difficulty" htmlFor="difficulty" required>
                <Select id="difficulty" value={draft.difficulty} onChange={(e) => set("difficulty", e.target.value as Difficulty)}>
                  {["Beginner", "Intermediate", "Advanced"].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </Select>
              </Field>
              <Field label="URL" htmlFor="slug" error={err("slug")}>
                <Input id="slug" value={draft.slug} placeholder={slugify(draft.title) || "auto from title"} onChange={(e) => set("slug", slugify(e.target.value))} aria-invalid={err("slug") ? true : undefined} />
              </Field>
            </div>
            <Field label="Cover image" htmlFor="cover" required error={err("image")}>
              <ThumbnailPicker id="cover" folder="challenges" value={draft.image} onChange={(src) => set("image", src)} invalid={!!err("image")} />
            </Field>
          </div>
        </Panel>

        <Panel title="The brief" description="Explain exactly what entrants should record and what a great entry looks like.">
          <div className="space-y-5">
            <Field label="Brief" htmlFor="brief" required error={err("brief")}>
              <Textarea id="brief" rows={6} value={draft.brief} onChange={(e) => set("brief", e.target.value)} aria-invalid={err("brief") ? true : undefined} />
            </Field>
            <Field label="Rules" htmlFor="rules" required error={err("rules")}>
              <ListEditor id="rules" items={draft.rules} onChange={(v) => set("rules", v)} min={2} max={10} maxLength={140} placeholders={["Keep it to 60 seconds, recorded in one take."]} />
            </Field>
          </div>
        </Panel>

        <Panel title="Judging" description="How entries are scored. Weights must add up to 100%.">
          <ul className="space-y-3">
            {draft.judging.map((j, i) => (
              <li key={i} className="flex items-center gap-2">
                <input
                  value={j.label}
                  onChange={(e) => set("judging", draft.judging.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))}
                  placeholder="Criterion, e.g. Timing"
                  aria-label={`Criterion ${i + 1}`}
                  className={`${inputClass} h-10 flex-1 text-sm`}
                />
                <div className="relative w-24">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={j.weight}
                    onChange={(e) => set("judging", draft.judging.map((x, k) => (k === i ? { ...x, weight: Math.max(0, Math.min(100, Number(e.target.value) || 0)) } : x)))}
                    aria-label={`Weight for criterion ${i + 1}`}
                    className={`${inputClass} h-10 pr-7 text-right text-sm tabular-nums`}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
                <button type="button" onClick={() => set("judging", draft.judging.filter((_, k) => k !== i))} aria-label={`Remove criterion ${i + 1}`} className={ghostIconButton}>
                  <CloseIcon className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-foreground/10" aria-hidden="true">
            {draft.judging.map((j, i) => (
              <span key={i} className="bg-brand first:rounded-l-full" style={{ width: `${Math.min(j.weight, 100)}%`, opacity: 1 - i * 0.18 }} />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button type="button" onClick={() => set("judging", [...draft.judging, { label: "", weight: 0 }])} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-brand-deep hover:bg-brand/10 dark:text-brand">
              <PlusIcon className="size-4" /> Add criterion
            </button>
            <span className={`text-sm font-semibold tabular-nums ${total === 100 ? "text-brand-deep dark:text-brand" : "text-red-600 dark:text-red-400"}`} aria-live="polite">
              Total {total}%
            </span>
          </div>
          {err("judging") && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{err("judging")}</p>}
        </Panel>

        <Panel title="Inspiration videos" description="YouTube routines that show what the challenge is about. Paste a link and we'll fill in the title.">
          <InspirationEditor items={draft.inspiration} onChange={(fn) => setDraft((d) => ({ ...d, inspiration: fn(d.inspiration) }))} />
        </Panel>

        {state === "ended" && (
          <Panel title="Winners" description="Shown on a podium on the challenge page. Save to publish them.">
            <WinnersEditor winners={draft.winners ?? []} onChange={(w) => set("winners", w)} />
          </Panel>
        )}

        {!isNew && (
          <ChallengeEntries
            entries={entries}
            onPodium={
              state === "ended"
                ? (entry) =>
                    setDraft((d) => {
                      const winners = d.winners ?? [];
                      if (winners.length >= 3 || winners.some((w) => w.name === entry.name)) return d;
                      return { ...d, winners: [...winners, { place: (winners.length + 1) as 1 | 2 | 3, name: entry.name, avatar: avatars[winners.length], city: "" }] };
                    })
                : undefined
            }
          />
        )}
      </div>

      <aside className="min-w-0 space-y-6 xl:sticky xl:top-24 xl:self-start">
        <Panel title="Status" actions={<ChallengeStateBadge state={state} />}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {!draft.published
                ? "Drafts are only visible to your team."
                : state === "live"
                  ? "Open for entries now."
                  : state === "upcoming"
                    ? "Visible on the site, opening for entries on the start date."
                    : "Closed. Add winners below."}
              {dirty && " You have unsaved changes."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Opens" htmlFor="opens" required>
                <Input id="opens" type="date" value={draft.opens} onChange={(e) => set("opens", e.target.value)} className="px-2.5 text-sm dark:[color-scheme:dark]" />
              </Field>
              <Field label="Closes" htmlFor="closes" required>
                <Input id="closes" type="date" value={draft.closes} min={draft.opens} onChange={(e) => set("closes", e.target.value)} aria-invalid={err("closes") ? true : undefined} className="px-2.5 text-sm dark:[color-scheme:dark]" />
              </Field>
            </div>
            {err("closes") && <p className="text-sm text-red-600 dark:text-red-400">{err("closes")}</p>}
            <Field label="Prize" htmlFor="prize" required error={err("prize")}>
              <Textarea id="prize" rows={2} maxLength={120} value={draft.prize} onChange={(e) => set("prize", e.target.value)} placeholder="e.g. Free Scratch School course + featured on our socials" aria-invalid={err("prize") ? true : undefined} />
            </Field>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">{draft.entries}</span> entries so far
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" disabled={busy} onClick={() => submit(false)} className={secondaryButton}>
                {draft.published ? "Unpublish" : "Save draft"}
              </button>
              <button type="button" disabled={busy} onClick={() => submit(true)} className={primaryButton}>
                {draft.published ? "Update" : "Publish"}
              </button>
            </div>
            {draft.published && (
              <Link href={`/challenges/${draft.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                View on site <ArrowUpRightIcon className="size-3.5" />
              </Link>
            )}
          </div>
        </Panel>

        {Object.keys(problems).length > 0 && (
          <Panel title="Before publishing">
            <ul className="space-y-2 text-sm">
              {Object.values(problems).map((p) => (
                <li key={p} className="flex gap-2 text-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#c98200] dark:bg-[#ffb938]" />
                  {p}
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </aside>
    </div>
  );
}

function InspirationEditor({ items, onChange }: { items: Inspiration[]; onChange: (fn: (items: Inspiration[]) => Inspiration[]) => void }) {
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function add() {
    setError("");
    setBusy(true);
    const info = await inspectYouTube(link);
    setBusy(false);
    if (!info.ok) return setError(info.error);
    onChange((list) => [...list, { youtube: link.trim(), title: info.title, dj: info.channel, note: "" }]);
    setLink("");
  }

  const patch = (i: number, p: Partial<Inspiration>) => onChange((list) => list.map((x, k) => (k === i ? { ...x, ...p } : x)));

  return (
    <div className="space-y-4">
      {items.map((v, i) => {
        const id = youtubeId(v.youtube);
        return (
          <div key={`${v.youtube}-${i}`} className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row">
            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-neutral-900 sm:w-40">
              {id && <Image src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" fill sizes="160px" className="object-cover" />}
            </div>
            <div className="grid min-w-0 flex-1 gap-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={v.dj} onChange={(e) => patch(i, { dj: e.target.value })} placeholder="DJ" aria-label="DJ" className={`${inputClass} h-9 text-sm`} />
                <input value={v.title} onChange={(e) => patch(i, { title: e.target.value })} placeholder="Title" aria-label="Video title" className={`${inputClass} h-9 text-sm`} />
              </div>
              <input value={v.note} onChange={(e) => patch(i, { note: e.target.value })} placeholder="What should entrants notice?" aria-label="Note" className={`${inputClass} h-9 text-sm`} />
            </div>
            <button type="button" onClick={() => onChange((list) => list.filter((_, k) => k !== i))} aria-label="Remove video" className={`${ghostIconButton} self-start`}>
              <CloseIcon className="size-4" />
            </button>
          </div>
        );
      })}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), youtubeId(link) && add())}
          placeholder="Paste a YouTube link"
          aria-label="YouTube link for an inspiration video"
          className={`${inputClass} h-10 flex-1 text-sm`}
        />
        <button type="button" disabled={!youtubeId(link) || busy} onClick={add} className={primaryButton}>
          {busy ? "Checking…" : "Add video"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function WinnersEditor({ winners, onChange }: { winners: Winner[]; onChange: (w: Winner[]) => void }) {
  const places: Winner["place"][] = [1, 2, 3];
  const get = (place: Winner["place"]) => winners.find((w) => w.place === place) ?? { place, name: "", city: "", avatar: avatars[place - 1] };
  const patch = (place: Winner["place"], p: Partial<Winner>) => {
    const next = places.map((pl) => (pl === place ? { ...get(pl), ...p } : get(pl))).filter((w) => w.name.trim());
    onChange(next);
  };

  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {places.map((place) => {
        const w = get(place);
        return (
          <li key={place} className="rounded-xl border border-border p-4">
            <p className="text-sm font-semibold text-foreground">{place === 1 ? "🥇 1st place" : place === 2 ? "🥈 2nd place" : "🥉 3rd place"}</p>
            <div className="mt-3 flex gap-1.5">
              {avatars.map((src) => (
                <button key={src} type="button" onClick={() => patch(place, { avatar: src })} aria-pressed={w.avatar === src} aria-label="Choose photo" className={`rounded-full ring-2 ${w.avatar === src ? "ring-brand" : "ring-transparent"}`}>
                  <Image src={src} alt="" width={56} height={56} className="size-7 rounded-full object-cover" />
                </button>
              ))}
            </div>
            <input value={w.name} onChange={(e) => patch(place, { name: e.target.value })} placeholder="Name" aria-label={`Place ${place} name`} className={`${inputClass} mt-3 h-9 text-sm`} />
            <input value={w.city} onChange={(e) => patch(place, { city: e.target.value })} placeholder="City" aria-label={`Place ${place} city`} className={`${inputClass} mt-2 h-9 text-sm`} />
          </li>
        );
      })}
    </ol>
  );
}
