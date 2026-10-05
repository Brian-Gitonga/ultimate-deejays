"use client";

import Image from "next/image";
import { useState } from "react";
import { deleteEntry, saveEntry } from "@/app/(studio)/studio/challenges/actions";
import { entryStatuses, type ChallengeEntry, type EntryStatus } from "@/lib/studio-challenges";
import { useServerCollection } from "@/lib/studio-store";
import { ArrowUpRightIcon, TrashIcon, TrophyIcon } from "../icons";
import { ConfirmDialog, useToast } from "./manage-table";
import { Panel, ghostIconButton, inputClass } from "./ui";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const statusTone: Record<EntryStatus, string> = {
  submitted: "bg-foreground/[0.06] text-foreground/80",
  shortlisted: "bg-accent-blue/10 text-accent-blue dark:text-[#7aa7ff]",
  winner: "bg-brand/10 text-brand-deep dark:text-brand",
  disqualified: "bg-red-500/10 text-red-700 dark:text-red-400",
};

/*
 * Judging: every entry for this challenge with its video, a status, a score
 * out of 100 and private notes. Changes save as you make them.
 */
export function ChallengeEntries({ entries, onPodium }: { entries: ChallengeEntry[]; onPodium?: (entry: ChallengeEntry) => void }) {
  const { items, save, remove } = useServerCollection(entries, { save: saveEntry, remove: deleteEntry });
  const [filter, setFilter] = useState<EntryStatus | "all">("all");
  const [confirm, setConfirm] = useState<ChallengeEntry | null>(null);
  const { show, toast } = useToast();
  const shown = filter === "all" ? items : items.filter((e) => e.status === filter);
  const count = (status: EntryStatus) => items.filter((e) => e.status === status).length;

  return (
    <div id="entries" className="scroll-mt-24">
      <Panel
        title={`Entries (${items.length})`}
        description="Watch each entry, then shortlist, score (out of 100) and pick winners. Notes are private to the team."
      >
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No entries yet. They appear here as soon as someone submits the form on the challenge page.</p>
        ) : (
          <>
            <div role="tablist" aria-label="Filter entries" className="no-scrollbar -mx-1 mb-4 flex gap-1 overflow-x-auto px-1">
              {(["all", ...entryStatuses.map((s) => s.value)] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={filter === key}
                  onClick={() => setFilter(key)}
                  className={`h-8 shrink-0 rounded-lg px-3 text-sm font-medium transition ${filter === key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5"}`}
                >
                  {key === "all" ? `All ${items.length}` : `${entryStatuses.find((s) => s.value === key)!.label} ${count(key)}`}
                </button>
              ))}
            </div>
            <ul className="divide-y divide-border">
              {shown.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  onChange={(patch) => save({ ...entry, ...patch }).then((saved) => saved && show("Saved"))}
                  onDelete={() => setConfirm(entry)}
                  onPodium={onPodium && (() => {
                    onPodium(entry);
                    show(`${entry.name} added to the podium. Save the challenge to publish winners.`);
                  })}
                />
              ))}
            </ul>
          </>
        )}
      </Panel>
      {confirm && (
        <ConfirmDialog
          title="Delete this entry?"
          body={
            <>
              <span className="font-medium text-foreground">{confirm.name}</span>&apos;s entry will be removed for good. Use &ldquo;Disqualified&rdquo; instead if you want to keep a record.
            </>
          }
          confirmLabel="Delete entry"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const entry = confirm;
            setConfirm(null);
            remove(entry.id).then((done) => done && show("Entry deleted"));
          }}
        />
      )}
      {toast}
    </div>
  );
}

function EntryRow({
  entry,
  onChange,
  onDelete,
  onPodium,
}: {
  entry: ChallengeEntry;
  onChange: (patch: Partial<ChallengeEntry>) => void;
  onDelete: () => void;
  onPodium?: () => void;
}) {
  const [score, setScore] = useState(entry.score === null ? "" : String(entry.score));
  const [notes, setNotes] = useState(entry.notes);

  function commitScore() {
    const value = score.trim() === "" ? null : Math.min(100, Math.max(0, Number(score)));
    if (value !== null && Number.isNaN(value)) return setScore(entry.score === null ? "" : String(entry.score));
    if (value !== entry.score) onChange({ score: value });
  }

  return (
    <li className="grid gap-4 py-4 first:pt-0 last:pb-0 sm:grid-cols-[9rem_minmax(0,1fr)]">
      <a href={entry.youtubeUrl} target="_blank" rel="noreferrer" className="group relative block aspect-video overflow-hidden rounded-lg bg-neutral-900">
        <Image src={`https://i.ytimg.com/vi/${entry.youtubeId}/hqdefault.jpg`} alt={`Watch ${entry.name}'s entry`} fill sizes="144px" className="object-cover transition group-hover:opacity-80" />
      </a>
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-foreground">
              {entry.name}
              {entry.hasAccount && <span className="ml-2 rounded-full bg-foreground/[0.06] px-2 py-0.5 text-xs font-medium text-muted-foreground">Student</span>}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {entry.email} · {dateFormat.format(new Date(entry.createdAt))}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <a href={entry.youtubeUrl} target="_blank" rel="noreferrer" className={ghostIconButton} aria-label={`Open ${entry.name}'s video on YouTube`}>
              <ArrowUpRightIcon className="size-4" />
            </a>
            {onPodium && (
              <button type="button" onClick={onPodium} className={ghostIconButton} aria-label={`Add ${entry.name} to the winners podium`} title="Add to podium">
                <TrophyIcon className="size-4" />
              </button>
            )}
            <button type="button" onClick={onDelete} className={`${ghostIconButton} hover:text-red-600`} aria-label={`Delete ${entry.name}'s entry`}>
              <TrashIcon className="size-4" />
            </button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[10rem_7rem_minmax(0,1fr)]">
          <label className="text-xs text-muted-foreground">
            Status
            <select
              value={entry.status}
              onChange={(e) => onChange({ status: e.target.value as EntryStatus })}
              className={`${inputClass} mt-1 h-9 text-sm ${statusTone[entry.status]}`}
            >
              {entryStatuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            Score /100
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              onBlur={commitScore}
              className={`${inputClass} mt-1 h-9 text-sm tabular-nums`}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            Private notes
            <input
              value={notes}
              maxLength={2000}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== entry.notes && onChange({ notes })}
              placeholder="e.g. Clean cuts, timing drifts at 0:40"
              className={`${inputClass} mt-1 h-9 text-sm`}
            />
          </label>
        </div>
      </div>
    </li>
  );
}
