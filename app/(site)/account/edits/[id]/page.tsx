import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountCard } from "@/components/account-card";
import { EditStatusChip } from "@/components/edits/edit-status";
import { CancelRequestButton, MarkSeen, ReplyForm } from "@/components/edits/request-actions";
import { ArrowUpRightIcon, CheckIcon, DownloadIcon } from "@/components/icons";
import { requireViewer } from "@/lib/dal";
import { getMyEditRequest } from "@/lib/db/edits";
import { editFileHref, openStatuses, type EditRequest } from "@/lib/edits";
import { formatPhone } from "@/lib/phone";
import { formatSize, resourcePath } from "@/lib/store";

export const metadata: Metadata = { title: "Edit request" };

const when = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/* One edit request: where it is, the finished files, the conversation with the team, and what the member sent. */
export default async function EditRequestPage({ params, searchParams }: PageProps<"/account/edits/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  await requireViewer(`/account/edits/${id}`);
  const request = await getMyEditRequest(id);
  if (!request) notFound();

  const open = openStatuses.includes(request.status);
  const ready = request.status === "delivered";
  const lastFromTeam = [...request.messages].reverse().find((m) => m.author === "team");

  return (
    <>
      {ready && !request.seenAt && <MarkSeen requestId={request.id} />}
      <div>
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link href="/account/edits" className="hover:text-brand">
            My edits
          </Link>{" "}
          / Request #{request.number}
        </nav>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-foreground">{request.resource.title || "Template"}</h1>
          <EditStatusChip status={request.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Sent {when.format(new Date(request.createdAt))}
          {request.resource.slug && (
            <>
              {" · "}
              <Link href={resourcePath(request.resource.slug, request.resource.lowerThird)} className="font-medium text-brand hover:underline">
                View the template
              </Link>
            </>
          )}
        </p>
      </div>

      {query.sent === "1" && (
        <p role="status" className="flex items-start gap-3 rounded-2xl border border-brand/25 bg-brand/[0.07] px-4 py-3 text-sm text-foreground">
          <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
          <span>
            Request sent. We&apos;ll put the finished files here
            {request.phone ? ` and message you at ${formatPhone(request.phone)} when they're ready` : ""}.
          </span>
        </p>
      )}

      {ready && <Delivered request={request} note={lastFromTeam?.body} />}
      {request.status === "needs_info" && lastFromTeam && (
        <p role="status" className="rounded-2xl border border-accent-amber/40 bg-accent-amber/10 px-4 py-3 text-sm text-foreground">
          <span className="font-semibold">The team has a question:</span> {lastFromTeam.body}
        </p>
      )}

      <AccountCard title="Messages" description={open ? "Questions from the team, and anything you'd like to add." : undefined}>
        {request.messages.length ? (
          <ol className="space-y-3">
            {request.messages.map((m) => (
              <li key={m.id} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.author === "team" ? "bg-muted text-foreground" : "ml-auto bg-brand/10 text-foreground"}`}>
                <p className="text-xs font-semibold text-muted-foreground">
                  {m.author === "team" ? "Ultimate Deejays team" : "You"} · {when.format(new Date(m.createdAt))}
                </p>
                <p className="mt-1 whitespace-pre-line">{m.body}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">No messages yet. If we need anything, we&apos;ll ask here.</p>
        )}
        {open && <ReplyForm requestId={request.id} question={request.status === "needs_info"} />}
      </AccountCard>

      <AccountCard title="What you sent">
        <dl className="grid gap-4 sm:grid-cols-2">
          {request.answers.map((a) => (
            <div key={a.id} className={a.type === "textarea" ? "sm:col-span-2" : undefined}>
              <dt className="text-xs font-medium text-muted-foreground">{a.label}</dt>
              <dd className="mt-1 text-sm break-words text-foreground">
                {a.type === "file" ? (
                  <a href={editFileHref(request.id, a.value)} className="font-medium text-brand hover:underline">
                    {a.name ?? "Your file"}
                  </a>
                ) : a.type === "color" ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="size-4 rounded border border-border" style={{ background: a.value }} />
                    {a.value.toUpperCase()}
                  </span>
                ) : (
                  <span className="whitespace-pre-line">{a.value}</span>
                )}
              </dd>
            </div>
          ))}
          {request.notes && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-muted-foreground">Notes</dt>
              <dd className="mt-1 text-sm whitespace-pre-line text-foreground">{request.notes}</dd>
            </div>
          )}
        </dl>
        {(request.status === "submitted" || request.status === "needs_info") && (
          <div className="mt-6 border-t border-border pt-4">
            <CancelRequestButton requestId={request.id} />
          </div>
        )}
      </AccountCard>
    </>
  );
}

/* The finished files, with the team's note. */
function Delivered({ request, note }: { request: EditRequest; note?: string }) {
  return (
    <section aria-labelledby="delivered-title" className="rounded-2xl border border-brand/25 bg-brand/[0.06] p-5 sm:p-6">
      <h2 id="delivered-title" className="text-lg font-semibold text-foreground">
        Your edit is ready
      </h2>
      {note && <p className="mt-1 text-sm whitespace-pre-line text-foreground/85">{note}</p>}
      <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-background">
        {request.files.map((f) => (
          <li key={f.id} className="flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">{f.name}</span>
              <span className="text-xs text-muted-foreground">{f.kind === "link" ? "Link" : formatSize(f.size)}</span>
            </span>
            <a
              href={f.kind === "link" ? f.url : editFileHref(request.id, f.path)}
              {...(f.kind === "link" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-white hover:brightness-110"
            >
              {f.kind === "link" ? <ArrowUpRightIcon className="size-4" /> : <DownloadIcon className="size-4" />}
              {f.kind === "link" ? "Open" : "Download"}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
