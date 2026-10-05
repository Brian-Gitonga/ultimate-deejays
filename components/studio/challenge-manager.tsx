"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { challengeTypes } from "@/lib/challenges";
import { challengeState, type ChallengeState, type StudioChallenge } from "@/lib/studio-challenges";
import { uid } from "@/lib/studio-courses";
import { deleteChallenge, saveChallenge } from "@/app/(studio)/studio/challenges/actions";
import { useServerCollection } from "@/lib/studio-store";
import { ArrowUpRightIcon, CloseIcon, PencilIcon, PlusIcon, TrophyIcon } from "../icons";
import { ConfirmDialog, ManageTable, RowMenu, useToast } from "./manage-table";
import { StatusBadge } from "./status";
import { primaryButton } from "./ui";

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const typeName = (slug: string) => challengeTypes.find((t) => t.slug === slug)?.name ?? slug;

export function ChallengeStateBadge({ state }: { state: ChallengeState }) {
  if (state === "live") return <StatusBadge status="published" label="Live" />;
  if (state === "upcoming") return <StatusBadge status="review" label="Upcoming" />;
  if (state === "draft") return <StatusBadge status="draft" />;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-foreground/[0.07] px-2.5 py-1 text-xs font-medium whitespace-nowrap text-foreground/75">
      <TrophyIcon className="size-3" strokeWidth={2.5} /> Ended
    </span>
  );
}

export function ChallengeManager({ seed }: { seed: StudioChallenge[] }) {
  const { items, save, remove } = useServerCollection(seed, { save: saveChallenge, remove: deleteChallenge });
  const [confirm, setConfirm] = useState<StudioChallenge | null>(null);
  const { show, toast } = useToast();
  const state = (c: StudioChallenge) => challengeState(c);

  return (
    <>
      <ManageTable
        title="All challenges"
        items={items}
        getId={(c) => c.id}
        searchText={(c) => [c.title, c.tagline, typeName(c.type), c.difficulty]}
        searchPlaceholder="Search challenges"
        initialSort={{ key: "closes", dir: -1 }}
        tabs={[
          { key: "all", label: "All", test: () => true },
          { key: "live", label: "Live", test: (c) => state(c) === "live" },
          { key: "upcoming", label: "Upcoming", test: (c) => state(c) === "upcoming" },
          { key: "ended", label: "Ended", test: (c) => state(c) === "ended" },
          { key: "draft", label: "Drafts", test: (c) => state(c) === "draft" },
        ]}
        columns={[
          {
            key: "title",
            header: "Challenge",
            sort: (c) => c.title,
            render: (c) => (
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-muted">
                  {c.image && <Image src={c.image} alt="" fill sizes="72px" unoptimized={c.image.startsWith("data:")} className="object-cover" />}
                </div>
                <div className="min-w-0 max-w-[22rem]">
                  <Link href={`/studio/challenges/${c.id}/edit`} className="line-clamp-1 font-medium text-foreground hover:text-brand">
                    {c.title || "Untitled challenge"}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.tagline}</p>
                </div>
              </div>
            ),
          },
          { key: "type", header: "Type", sort: (c) => c.type, render: (c) => <span className="text-foreground">{typeName(c.type)}</span> },
          { key: "difficulty", header: "Level", sort: (c) => c.difficulty, render: (c) => <span className="text-muted-foreground">{c.difficulty}</span> },
          { key: "state", header: "Status", sort: (c) => state(c), render: (c) => <ChallengeStateBadge state={state(c)} /> },
          {
            key: "closes",
            header: "Runs",
            sort: (c) => c.closes,
            render: (c) => (
              <span className="whitespace-nowrap text-muted-foreground">
                {shortDate.format(new Date(c.opens))} → {shortDate.format(new Date(c.closes))}
              </span>
            ),
          },
          { key: "entries", header: "Entries", align: "right", sort: (c) => c.entries, render: (c) => <span className="text-foreground tabular-nums">{c.entries}</span> },
        ]}
        actions={(c) => (
          <RowMenu
            label={`Actions for ${c.title}`}
            items={[
              { label: "Edit challenge", icon: PencilIcon, href: `/studio/challenges/${c.id}/edit` },
              c.published && { label: "View on site", icon: ArrowUpRightIcon, href: `/challenges/${c.slug}`, external: true },
              {
                label: "Duplicate",
                icon: PlusIcon,
                onSelect: () => {
                  const id = uid();
                  save({ ...c, id, slug: `${c.slug}-${id.slice(0, 4)}`, title: `${c.title} (copy)`, published: false, entries: 0, winners: undefined }).then(
                    (saved) => saved && show("Duplicated as a draft"),
                  );
                },
              },
              { label: "Delete", icon: CloseIcon, danger: true, onSelect: () => setConfirm(c) },
            ]}
          />
        )}
        empty={
          <>
            <p className="text-lg font-semibold text-foreground">No challenges yet</p>
            <Link href="/studio/challenges/new" className={`${primaryButton} mt-4`}>
              <PlusIcon className="size-4" /> Create a challenge
            </Link>
          </>
        }
      />
      {confirm && (
        <ConfirmDialog
          title="Delete this challenge?"
          body={
            <>
              <span className="font-medium text-foreground">{confirm.title}</span>
              {confirm.entries ? ` has ${confirm.entries} entries, which will be deleted too.` : ""} Deleting it removes it from the site. This can&apos;t be undone.
            </>
          }
          confirmLabel="Delete challenge"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const challenge = confirm;
            setConfirm(null);
            remove(challenge.id).then((done) => done && show(`Deleted: ${challenge.title}`));
          }}
        />
      )}
      {toast}
    </>
  );
}
