"use client";

import Link from "next/link";
import { useCallback, useId, useRef, useState } from "react";
import { updateEditRequest, type EditUpdate } from "@/app/(studio)/studio/edits/actions";
import { deliveredPathFor, editFileHref, type EditFile, type StudioEditRequest } from "@/lib/edits";
import { formatPhone } from "@/lib/phone";
import { formatSize, planLabel, resourcePath } from "@/lib/store";
import { reportStudioError, runAction } from "@/lib/studio-store";
import { createClient } from "@/lib/supabase/client";
import { EditStatusChip } from "../edits/edit-status";
import { ArrowUpRightIcon, CheckIcon, LinkIcon, MessageIcon, PhoneIcon, PlusIcon, SlidersIcon, TrashIcon, UsersIcon, WhatsappIcon } from "../icons";
import { StoreCover } from "../store/store-cover";
import { Drawer } from "./drawer";
import { ManageTable, useToast } from "./manage-table";
import { Field, Input, Kpi, Textarea, primaryButton, secondaryButton } from "./ui";

const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const when = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/*
 * Studio → Edit requests: the queue of template edits members asked for.
 * Open one to see what they want, ask a question, deliver the edited files
 * (uploaded to the private edits bucket, or links) or decline it.
 */
export function EditRequestManager({ seed, smsReady, initialId }: { seed: StudioEditRequest[]; smsReady: boolean; initialId?: string }) {
  const [items, setItems] = useState(seed);
  const [seen, setSeen] = useState(seed);
  if (seed !== seen) {
    setSeen(seed);
    setItems(seed);
  }
  const [openId, setOpenId] = useState<string | null>(initialId && seed.some((r) => r.id === initialId) ? initialId : null);
  const open = items.find((r) => r.id === openId) ?? null;
  const { show, toast } = useToast();

  const month = new Date().toISOString().slice(0, 7);
  const count = (test: (r: StudioEditRequest) => boolean) => String(items.filter(test).length);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon={SlidersIcon} label="New" value={count((r) => r.status === "submitted")} note="Waiting for you to start" />
        <Kpi icon={SlidersIcon} label="In progress" value={count((r) => r.status === "in_progress")} note="Being edited" />
        <Kpi icon={MessageIcon} label="Waiting for members" value={count((r) => r.status === "needs_info")} note="You asked a question" />
        <Kpi icon={CheckIcon} label="Delivered this month" value={count((r) => r.status === "delivered" && (r.deliveredAt ?? "").startsWith(month))} note={smsReady ? "Members are texted when it's ready" : "Texts are off (see below)"} />
      </ul>

      <ManageTable
        title="Requests"
        items={items}
        getId={(r) => r.id}
        minWidth="56rem"
        initialSort={{ key: "sent", dir: -1 }}
        searchText={(r) => [r.resource.title, r.member.name, r.member.email, `#${r.number}`, r.phone]}
        searchPlaceholder="Search by template, member, phone or #number"
        onRowClick={(r) => setOpenId(r.id)}
        tabs={[
          { key: "todo", label: "To do", test: (r: StudioEditRequest) => r.status === "submitted" || r.status === "in_progress" },
          { key: "waiting", label: "Waiting for member", test: (r: StudioEditRequest) => r.status === "needs_info" },
          { key: "delivered", label: "Delivered", test: (r: StudioEditRequest) => r.status === "delivered" },
          { key: "all", label: "All", test: () => true },
        ]}
        columns={[
          {
            key: "request",
            header: "Request",
            sort: (r) => r.number,
            render: (r) => (
              <span className="flex items-center gap-3">
                <span className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                  <StoreCover resource={{ title: r.resource.title, thumbnail: r.resource.thumbnail, category: "templates", lowerThird: r.resource.lowerThird }} sizes="80px" compact />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">{r.resource.title || "Deleted template"}</span>
                  <span className="block text-xs text-muted-foreground">#{r.number}</span>
                </span>
              </span>
            ),
          },
          {
            key: "member",
            header: "Member",
            sort: (r) => r.member.name,
            render: (r) => (
              <span className="min-w-0">
                <span className="block truncate text-foreground">{r.member.name}</span>
                <span className="block truncate text-xs text-muted-foreground tabular-nums">
                  {planLabel(r.member.plan)} plan{r.phone ? ` · ${formatPhone(r.phone)}` : ""}
                </span>
              </span>
            ),
          },
          { key: "status", header: "Status", sort: (r) => r.status, render: (r) => <EditStatusChip status={r.status} audience="studio" /> },
          { key: "sent", header: "Sent", sort: (r) => r.createdAt, render: (r) => <span className="whitespace-nowrap text-muted-foreground">{date.format(new Date(r.createdAt))}</span> },
          { key: "updated", header: "Updated", sort: (r) => r.updatedAt, render: (r) => <span className="whitespace-nowrap text-muted-foreground">{date.format(new Date(r.updatedAt))}</span> },
        ]}
        empty={
          <p className="text-muted-foreground">
            No edit requests yet. Turn on <span className="font-medium text-foreground">Members can request an edit</span> for a template in{" "}
            <Link href="/studio/store" className="font-medium text-brand hover:underline">
              Studio → Store
            </Link>
            .
          </p>
        }
      />

      {!smsReady && (
        <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          Text messages are off. To text members when an edit is ready, add <code className="text-xs">AFRICASTALKING_USERNAME</code> and{" "}
          <code className="text-xs">AFRICASTALKING_API_KEY</code> to the site&apos;s environment (see .env.example). Members still see every update in their account.
        </p>
      )}

      {open && (
        <RequestDrawer
          key={open.id}
          request={open}
          smsReady={smsReady}
          onClose={() => setOpenId(null)}
          onSaved={(next, label) => {
            setItems((list) => list.map((r) => (r.id === next.id ? next : r)));
            show(label);
          }}
        />
      )}
      {toast}
    </>
  );
}

function RequestDrawer({
  request: r,
  smsReady,
  onClose,
  onSaved,
}: {
  request: StudioEditRequest;
  smsReady: boolean;
  onClose: () => void;
  onSaved: (next: StudioEditRequest, label: string) => void;
}) {
  const titleId = useId();
  const [files, setFiles] = useState<EditFile[]>(r.files);
  const [deliveryNote, setDeliveryNote] = useState("");
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState(r.adminNotes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<string[]>([]);
  const [linkOpen, setLinkOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // Uploads made in this drawer: removed again if it's closed without saving.
  const fresh = useRef(new Set<string>());
  const closed = r.status === "declined" || r.status === "cancelled";
  // The number they gave is always shown: the team may want to call or WhatsApp them.
  const texts = !r.phone
    ? "No phone number given."
    : r.textMe
      ? smsReady
        ? "They'll get a text when it's delivered."
        : "They asked for a text, but texts are off."
      : "They didn't ask for texts.";

  const discardFresh = useCallback((paths: string[]) => {
    if (!paths.length) return;
    paths.forEach((p) => fresh.current.delete(p));
    createClient().storage.from("edits").remove(paths).catch(() => {});
  }, []);

  const close = useCallback(() => {
    discardFresh([...fresh.current]);
    onClose();
  }, [discardFresh, onClose]);

  async function run(update: EditUpdate, label: string) {
    if (uploading.length) return setError("Wait for the uploads to finish.");
    setBusy(true);
    setError("");
    const result = await runAction(() => updateEditRequest(r.id, { adminNotes: notes, ...update }));
    setBusy(false);
    if (!result.ok) return setError(result.error);
    fresh.current.clear();
    setMessage("");
    setDeliveryNote("");
    onSaved(result.record, label);
  }

  async function upload(list: FileList | null) {
    if (!list?.length) return;
    const supabase = createClient();
    for (const file of Array.from(list)) {
      setUploading((u) => [...u, file.name]);
      const path = deliveredPathFor(r.id, file.name);
      const { error: uploadError } = await supabase.storage.from("edits").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      setUploading((u) => u.filter((n) => n !== file.name));
      if (uploadError) {
        const tooBig = /exceeded|too large|payload/i.test(uploadError.message);
        reportStudioError(
          tooBig
            ? `“${file.name}” is bigger than your Supabase upload limit (50 MB on the free plan). Put it on Google Drive or Dropbox and add it as a link.`
            : `Couldn't upload “${file.name}”: ${uploadError.message}. Check that migration 016 has been run.`,
        );
        continue;
      }
      fresh.current.add(path);
      setFiles((f) => [...f, { id: crypto.randomUUID(), name: file.name, kind: "storage", path, url: "", size: file.size, mime: file.type }]);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeFile(file: EditFile) {
    setFiles((list) => list.filter((f) => f.id !== file.id));
    if (file.kind === "storage" && fresh.current.has(file.path)) discardFresh([file.path]);
  }

  return (
    <Drawer
      titleId={titleId}
      onClose={close}
      header={
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={titleId} className="text-lg font-semibold text-foreground">
              Request #{r.number}
            </h2>
            <EditStatusChip status={r.status} audience="studio" />
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {r.resource.slug ? (
              <Link href={resourcePath(r.resource.slug, r.resource.lowerThird)} target="_blank" className="hover:text-brand">
                {r.resource.title}
              </Link>
            ) : (
              r.resource.title || "Deleted template"
            )}{" "}
            · sent {when.format(new Date(r.createdAt))}
          </p>
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <p role="alert" className="min-w-0 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
          <button type="button" disabled={busy || notes === r.adminNotes} onClick={() => run({}, "Notes saved")} className={secondaryButton}>
            Save notes
          </button>
        </div>
      }
    >
      <section aria-label="Member" className="flex items-start gap-3 rounded-xl border border-border p-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          <UsersIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium text-foreground">
            {r.member.name} <span className="font-normal text-muted-foreground">· {planLabel(r.member.plan)} plan</span>
          </p>
          <p className="truncate text-muted-foreground">{r.member.email}</p>
          {r.phone && (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-medium text-foreground tabular-nums">{formatPhone(r.phone)}</span>
              <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                <PhoneIcon className="size-3.5" /> Call
              </a>
              <a href={`https://wa.me/${r.phone.replace(/D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                <WhatsappIcon className="size-3.5" /> WhatsApp
              </a>
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{texts}</p>
        </div>
        <Link href={`/studio/students?q=${encodeURIComponent(r.member.email)}`} className="shrink-0 text-xs font-medium text-brand hover:underline">
          Student
        </Link>
      </section>

      <section aria-labelledby={`${titleId}-answers`}>
        <h3 id={`${titleId}-answers`} className="text-sm font-medium text-foreground">
          What they want
        </h3>
        <dl className="mt-2 divide-y divide-border rounded-xl border border-border">
          {r.answers.map((a) => (
            <div key={a.id} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 px-3 py-2.5 text-sm">
              <dt className="text-muted-foreground">{a.label}</dt>
              <dd className="break-words text-foreground">
                {a.type === "file" ? (
                  <a href={editFileHref(r.id, a.value)} className="font-medium text-brand hover:underline">
                    {a.name ?? "Download file"}
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
          {r.notes && (
            <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 px-3 py-2.5 text-sm">
              <dt className="text-muted-foreground">Notes</dt>
              <dd className="whitespace-pre-line text-foreground">{r.notes}</dd>
            </div>
          )}
        </dl>
      </section>

      {r.messages.length > 0 && (
        <section aria-labelledby={`${titleId}-thread`}>
          <h3 id={`${titleId}-thread`} className="text-sm font-medium text-foreground">
            Conversation
          </h3>
          <ol className="mt-2 space-y-2">
            {r.messages.map((m) => (
              <li key={m.id} className={`rounded-xl px-3 py-2 text-sm ${m.author === "team" ? "bg-brand/10" : "bg-muted"}`}>
                <p className="text-xs font-semibold text-muted-foreground">
                  {m.author === "team" ? "Your team" : r.member.name} · {when.format(new Date(m.createdAt))}
                </p>
                <p className="mt-0.5 whitespace-pre-line text-foreground">{m.body}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {!closed && (
        <section aria-labelledby={`${titleId}-deliver`} className="rounded-xl border border-border p-4">
          <h3 id={`${titleId}-deliver`} className="text-sm font-medium text-foreground">
            {r.status === "delivered" ? "Delivered files" : "Deliver the edit"}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">They download these from Account → My edits.</p>
          {files.length > 0 && (
            <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
              {files.map((f) => (
                <li key={f.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  {f.kind === "link" ? <LinkIcon className="size-4 shrink-0 text-muted-foreground" /> : <CheckIcon className="size-4 shrink-0 text-brand" />}
                  <span className="min-w-0 flex-1 truncate text-foreground">{f.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{f.kind === "link" ? "Link" : formatSize(f.size)}</span>
                  <button type="button" onClick={() => removeFile(f)} aria-label={`Remove ${f.name}`} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-600">
                    <TrashIcon className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {uploading.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
              Uploading {uploading.join(", ")}…
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <input ref={fileRef} type="file" multiple className="sr-only" id={`${titleId}-upload`} onChange={(e) => upload(e.target.files)} />
            <label htmlFor={`${titleId}-upload`} className={`${secondaryButton} cursor-pointer`}>
              <PlusIcon className="size-4" /> Upload files
            </label>
            <button type="button" onClick={() => setLinkOpen((o) => !o)} aria-expanded={linkOpen} className={secondaryButton}>
              <LinkIcon className="size-4" /> Add a link
            </button>
          </div>
          {linkOpen && (
            <LinkForm
              onAdd={(file) => {
                setFiles((list) => [...list, file]);
                setLinkOpen(false);
              }}
            />
          )}
          <div className="mt-4">
            <Field label="Note to the member" htmlFor={`${titleId}-delivery-note`} hint="Optional, shown with the files.">
              <Textarea id={`${titleId}-delivery-note`} rows={2} maxLength={2000} value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} />
            </Field>
          </div>
          <button
            type="button"
            disabled={busy || !files.length}
            onClick={() => run({ status: "delivered", files, message: deliveryNote || undefined }, r.status === "delivered" ? "Delivery updated" : "Delivered: they can download it now")}
            className={`${primaryButton} mt-3`}
          >
            {busy ? "Saving…" : r.status === "delivered" ? "Update delivery" : "Deliver"}
          </button>
        </section>
      )}

      <section aria-labelledby={`${titleId}-message`} className="rounded-xl border border-border p-4">
        <h3 id={`${titleId}-message`} className="text-sm font-medium text-foreground">
          Message the member
        </h3>
        <Textarea
          id={`${titleId}-message-body`}
          aria-labelledby={`${titleId}-message`}
          rows={3}
          maxLength={2000}
          placeholder={closed ? "Why it was declined, or a note" : "A question, or an update"}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-2"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {!closed && r.status !== "delivered" && (
            <button type="button" disabled={busy || !message.trim()} onClick={() => run({ status: "needs_info", message }, "Question sent")} className={primaryButton}>
              Ask a question
            </button>
          )}
          <button type="button" disabled={busy || !message.trim()} onClick={() => run({ message }, "Message sent")} className={secondaryButton}>
            Send message
          </button>
          {!closed && r.status !== "delivered" && (
            <button
              type="button"
              disabled={busy || !message.trim()}
              onClick={() => run({ status: "declined", message }, "Declined: their edit goes back to their allowance")}
              className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-red-600 hover:bg-red-500/10 disabled:opacity-40 dark:text-red-400"
            >
              Decline
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Asking a question waits for their answer{r.textMe && r.phone && smsReady ? " and texts them" : ""}. Declining needs a reason and gives them the edit back.</p>
      </section>

      <div className="flex flex-wrap gap-2">
        {(r.status === "submitted" || r.status === "needs_info") && (
          <button type="button" disabled={busy} onClick={() => run({ status: "in_progress" }, "Marked in progress")} className={secondaryButton}>
            Start working on it
          </button>
        )}
        {(closed || r.status === "delivered") && (
          <button type="button" disabled={busy} onClick={() => run({ status: "in_progress" }, "Reopened")} className={secondaryButton}>
            Reopen
          </button>
        )}
      </div>

      <Field label="Private notes" htmlFor={`${titleId}-notes`} hint="Only your team sees these.">
        <Textarea id={`${titleId}-notes`} rows={3} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </Drawer>
  );
}

function LinkForm({ onAdd }: { onAdd: (file: EditFile) => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const valid = name.trim() && /^https?:\/\/\S+$/.test(url.trim());
  return (
    <div className="mt-3 space-y-3 rounded-lg border border-border bg-muted/40 p-3">
      <Field label="File name" htmlFor="edit-link-name">
        <Input id="edit-link-name" value={name} placeholder="e.g. Your lower third (4K).mov" onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Link" htmlFor="edit-link-url" hint="Google Drive, Dropbox or WeTransfer links work.">
        <Input id="edit-link-url" value={url} placeholder="https://" onChange={(e) => setUrl(e.target.value)} />
      </Field>
      <button
        type="button"
        disabled={!valid}
        onClick={() => onAdd({ id: crypto.randomUUID(), name: name.trim(), kind: "link", path: "", url: url.trim(), size: 0, mime: "" })}
        className={`${primaryButton} h-9`}
      >
        <ArrowUpRightIcon className="size-4" /> Add link
      </button>
    </div>
  );
}
