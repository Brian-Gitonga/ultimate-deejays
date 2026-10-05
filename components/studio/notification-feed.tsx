"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { markNotificationsRead } from "@/app/(studio)/studio/notifications/actions";
import type { Activity, ActivityKind } from "@/lib/db/studio/activity";
import { HandshakeIcon, MessageIcon, RefundIcon, StarIcon, TrophyIcon, UsersIcon, WalletIcon } from "../icons";
import { Panel } from "./ui";

const kinds: Record<ActivityKind, { icon: ComponentType<SVGProps<SVGSVGElement>>; tone: string; label: string }> = {
  student: { icon: UsersIcon, tone: "bg-accent-blue/10 text-accent-blue dark:text-[#7aa7ff]", label: "New student" },
  affiliate: { icon: HandshakeIcon, tone: "bg-accent-indigo/10 text-accent-indigo", label: "Affiliate application" },
  payment: { icon: WalletIcon, tone: "bg-brand/10 text-brand-deep dark:text-brand", label: "Payment" },
  refund: { icon: RefundIcon, tone: "bg-red-500/10 text-red-600 dark:text-red-400", label: "Refund" },
  entry: { icon: TrophyIcon, tone: "bg-accent-amber/15 text-[#b37400] dark:text-accent-amber", label: "Challenge entry" },
  review: { icon: StarIcon, tone: "bg-accent-amber/15 text-[#b37400] dark:text-accent-amber", label: "Review" },
  mix: { icon: MessageIcon, tone: "bg-foreground/[0.07] text-foreground", label: "Mix for feedback" },
};

const dayFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" });
const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

function dayLabel(iso: string) {
  const day = new Date(iso).toDateString();
  if (day === new Date().toDateString()) return "Today";
  if (day === new Date(Date.now() - 86_400_000).toDateString()) return "Yesterday";
  return dayFormat.format(new Date(iso));
}

/* The activity feed, grouped by day. Opening the page marks everything as read (the bell's count resets). */
export function NotificationFeed({ items, lastReadAt: lastReadProp, unread }: { items: Activity[]; lastReadAt: string | null; unread: number }) {
  // Keep this visit's "new" dots after the page marks everything read and refreshes.
  const [lastReadAt] = useState(lastReadProp);
  useEffect(() => {
    if (unread > 0) markNotificationsRead().catch(() => {});
  }, [unread]);

  const groups: { day: string; items: Activity[] }[] = [];
  for (const item of items) {
    const day = dayLabel(item.createdAt);
    const group = groups.at(-1);
    if (group?.day === day) group.items.push(item);
    else groups.push({ day, items: [item] });
  }

  if (!items.length) {
    return (
      <Panel>
        <p className="py-10 text-center text-muted-foreground">Nothing yet. Sign-ups, payments, entries, reviews and mixes show up here as they happen.</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <Panel key={group.day} title={group.day}>
          <ul className="-my-2 divide-y divide-border">
            {group.items.map((item) => {
              const kind = kinds[item.kind] ?? kinds.student;
              const isNew = !lastReadAt || item.createdAt > lastReadAt;
              return (
                <li key={item.id}>
                  <Link href={item.href} className="group flex items-start gap-3 py-3">
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${kind.tone}`}>
                      <kind.icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground group-hover:text-brand">{item.title}</span>
                        {isNew && <span className="size-2 shrink-0 rounded-full bg-accent-rose" aria-label="New" />}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {kind.label}
                        {item.detail ? ` · ${item.detail}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{timeFormat.format(new Date(item.createdAt))}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      ))}
    </div>
  );
}
