"use client";

import { useCallback, useId, useRef, useState } from "react";
import { deleteStoreResource, saveStoreResource } from "@/app/(studio)/studio/store/actions";
import { youtubeId } from "@/lib/curriculum";
import { formatDownloads, formatSize, planLabel, storagePathFor, storeCategories, categoryName, fileKind, type StudioStoreFile, type StudioStoreResource } from "@/lib/store";
import { slugify, type InstructorOption } from "@/lib/studio-courses";
import { reportStudioError, useServerCollection } from "@/lib/studio-store";
import { createClient } from "@/lib/supabase/client";
import { ArrowUpRightIcon, ChevronDownIcon, DownloadIcon, LinkIcon, PencilIcon, PlusIcon, TrashIcon, TrendUpIcon, UsersIcon } from "../icons";
import { fileIcons, StoreCover } from "../store/store-cover";
import { ThumbnailPicker } from "./course-fields";
import { Drawer } from "./drawer";
import { ConfirmDialog, ManageTable, RowMenu, useToast } from "./manage-table";
import { StatusBadge } from "./status";
import { Field, Input, Kpi, Select, Switch, Textarea, primaryButton, secondaryButton } from "./ui";

const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

const blank = (): StudioStoreResource => ({
  id: crypto.randomUUID(),
  slug: "",
  title: "",
  description: "",
  category: "practice-tracks",
  thumbnail: "",
  previewUrl: "",
  access: "warm-up",
  instructorId: null,
  status: "draft",
  featured: false,
  downloads: 0,
  stats: { total: 0, last30: 0, people: 0, lastAt: null },
  isDemo: false,
  publishedAt: null,
  updatedAt: new Date().toISOString(),
  files: [],
});

const totalSize = (r: Pick<StudioStoreResource, "files">) => r.files.reduce((s, f) => s + f.size, 0);

/*
 * Studio → Store: the downloads on /store. Add a resource, upload its files
 * (they go straight to the private store bucket) or add links for files
 * hosted elsewhere, pick who can download it, and publish.
 */
export function StoreManager({ seed, instructors }: { seed: StudioStoreResource[]; instructors: InstructorOption[] }) {
  const { items, save, remove } = useServerCollection(seed, { save: saveStoreResource, remove: deleteStoreResource });
  const [editing, setEditing] = useState<StudioStoreResource | null>(null);
  const [deleting, setDeleting] = useState<StudioStoreResource | null>(null);
  const { show, toast } = useToast();

  const published = items.filter((r) => r.status === "published");
  const downloads = items.reduce((s, r) => s + r.downloads, 0);
  const recent = items.reduce((s, r) => s + r.stats.last30, 0);
  const people = items.reduce((s, r) => s + r.stats.people, 0);
  const creator = (id: string | null) => instructors.find((i) => i.id === id)?.name ?? "Ultimate Deejays team";

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon={DownloadIcon} label="Live resources" value={String(published.length)} note={`${items.length - published.length} drafts`} />
        <Kpi icon={TrendUpIcon} label="Downloads" value={downloads.toLocaleString("en-US")} note="Counted once per person a day" />
        <Kpi icon={DownloadIcon} label="Last 30 days" value={recent.toLocaleString("en-US")} note="Every download, including repeats" />
        <Kpi icon={UsersIcon} label="Downloaders" value={people.toLocaleString("en-US")} note="Different people, per resource" />
      </ul>

      <ManageTable
        title="Resources"
        items={items}
        getId={(r) => r.id}
        minWidth="58rem"
        searchText={(r) => [r.title, r.slug, categoryName(r.category), creator(r.instructorId), ...r.files.map((f) => f.name)]}
        searchPlaceholder="Search resources or files"
        onRowClick={(r) => setEditing(r)}
        tabs={[
          { key: "all", label: "All", test: () => true },
          { key: "published", label: "Published", test: (r: StudioStoreResource) => r.status === "published" },
          { key: "draft", label: "Drafts", test: (r: StudioStoreResource) => r.status === "draft" },
        ]}
        toolbar={
          <button type="button" onClick={() => setEditing(blank())} className={`${primaryButton} h-10`}>
            <PlusIcon className="size-4" /> New resource
          </button>
        }
        columns={[
          {
            key: "title",
            header: "Resource",
            sort: (r) => r.title,
            render: (r) => (
              <span className="flex items-center gap-3">
                <span className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                  <StoreCover resource={r} sizes="80px" compact />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium text-foreground">{r.title}</span>
                    {r.isDemo && <span className="shrink-0 rounded bg-foreground/[0.07] px-1.5 py-0.5 text-[0.6875rem] font-medium text-foreground/70">Demo</span>}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {categoryName(r.category)} · {creator(r.instructorId)}
                  </span>
                </span>
              </span>
            ),
          },
          { key: "plan", header: "Who can download", sort: (r) => r.access, render: (r) => <span className="text-muted-foreground">{r.access === "warm-up" ? "Free (any member)" : `${planLabel(r.access)} +`}</span> },
          {
            key: "files",
            header: "Files",
            align: "right",
            sort: (r) => r.files.length,
            render: (r) => (
              <span className="text-muted-foreground tabular-nums">
                {r.files.length}
                {totalSize(r) ? ` · ${formatSize(totalSize(r))}` : ""}
              </span>
            ),
          },
          {
            key: "downloads",
            header: "Downloads",
            align: "right",
            sort: (r) => r.downloads,
            render: (r) => (
              <span className="tabular-nums">
                <span className="font-medium text-foreground">{r.downloads.toLocaleString("en-US")}</span>
                {r.stats.last30 > 0 && <span className="block text-xs text-muted-foreground">{r.stats.last30} in 30 days</span>}
              </span>
            ),
          },
          { key: "status", header: "Status", sort: (r) => r.status, render: (r) => <StatusBadge status={r.status === "published" ? "published" : "draft"} /> },
          { key: "updated", header: "Updated", sort: (r) => r.updatedAt, render: (r) => <span className="whitespace-nowrap text-muted-foreground">{date.format(new Date(r.updatedAt))}</span> },
        ]}
        actions={(r) => (
          <RowMenu
            label={`Actions for ${r.title}`}
            items={[
              { label: "Edit", icon: PencilIcon, onSelect: () => setEditing(r) },
              r.status === "published" && { label: "View on site", icon: ArrowUpRightIcon, href: `/store/${r.slug}`, external: true },
              { label: "Delete", icon: TrashIcon, danger: true, onSelect: () => setDeleting(r) },
            ]}
          />
        )}
        empty={<p className="text-muted-foreground">No resources yet. Add practice tracks, sample packs, cue sheets or templates for students to download.</p>}
      />

      {editing && (
        <ResourceDrawer
          key={editing.id}
          resource={editing}
          instructors={instructors}
          taken={items.filter((r) => r.id !== editing.id).map((r) => r.slug)}
          onClose={() => setEditing(null)}
          onSave={async (next) => {
            const saved = await save(next);
            if (saved) {
              setEditing(null);
              show(saved.status === "published" ? `${saved.title} is live in the store` : `${saved.title} saved as a draft`);
            }
            return !!saved;
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Delete “${deleting.title}”?`}
          body={`Its ${deleting.files.length} ${deleting.files.length === 1 ? "file is" : "files are"} deleted too, along with its download history. This can't be undone.`}
          confirmLabel="Delete resource"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            const r = deleting;
            setDeleting(null);
            remove(r.id).then((ok) => ok && show(`${r.title} deleted`));
          }}
        />
      )}
      {toast}
    </>
  );
}

function ResourceDrawer({
  resource,
  instructors,
  taken,
  onClose,
  onSave,
}: {
  resource: StudioStoreResource;
  instructors: InstructorOption[];
  taken: string[];
  onClose: () => void;
  onSave: (next: StudioStoreResource) => Promise<boolean>;
}) {
  const titleId = useId();
  const isNew = !resource.title;
  const [draft, setDraft] = useState(resource);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // Uploads made in this drawer: removed from the bucket again if you close without saving.
  const fresh = useRef(new Set<string>());
  const set = <K extends keyof StudioStoreResource>(key: K, value: StudioStoreResource[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const slugTaken = taken.includes(draft.slug);
  const previewBad = !!draft.previewUrl && !youtubeId(draft.previewUrl);

  const discardFresh = useCallback((paths: string[]) => {
    if (!paths.length) return;
    paths.forEach((p) => fresh.current.delete(p));
    createClient().storage.from("store").remove(paths).catch(() => {});
  }, []);

  const close = useCallback(() => {
    discardFresh([...fresh.current]);
    onClose();
  }, [discardFresh, onClose]);

  async function upload(list: FileList | null) {
    if (!list?.length) return;
    setError("");
    const supabase = createClient();
    for (const file of Array.from(list)) {
      setUploading((u) => [...u, file.name]);
      const path = storagePathFor(draft.id, file.name);
      const { error: uploadError } = await supabase.storage.from("store").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      setUploading((u) => u.filter((n) => n !== file.name));
      if (uploadError) {
        const tooBig = /exceeded|too large|payload/i.test(uploadError.message);
        reportStudioError(
          tooBig
            ? `“${file.name}” is bigger than your Supabase upload limit (50 MB on the free plan). Put it on Google Drive or Dropbox and add it as a link instead.`
            : `Couldn't upload “${file.name}”: ${uploadError.message}. Check that migration 014 has been run.`,
        );
        continue;
      }
      fresh.current.add(path);
      const added: StudioStoreFile = { id: crypto.randomUUID(), name: file.name, kind: "storage", path, url: "", size: file.size, mime: file.type };
      setDraft((d) => ({ ...d, files: [...d.files, added] }));
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeFile(file: StudioStoreFile) {
    setDraft((d) => ({ ...d, files: d.files.filter((f) => f.id !== file.id) }));
    // Uploaded in this drawer and never saved: delete it now. Saved files go when you save.
    if (file.kind === "storage" && fresh.current.has(file.path)) discardFresh([file.path]);
  }

  function move(index: number, by: -1 | 1) {
    setDraft((d) => {
      const files = [...d.files];
      const [item] = files.splice(index, 1);
      files.splice(index + by, 0, item);
      return { ...d, files };
    });
  }

  async function submit(status: StudioStoreResource["status"]) {
    if (!draft.title.trim()) return setError("Give it a title.");
    if (!draft.slug) return setError("Add a URL for it.");
    if (slugTaken) return setError("Another resource already uses that URL.");
    if (previewBad) return setError("The preview must be a YouTube link.");
    if (status === "published" && !draft.files.length) return setError("Add at least one file before publishing.");
    if (uploading.length) return setError("Wait for the uploads to finish.");
    setError("");
    setBusy(true);
    const ok = await onSave({ ...draft, status });
    setBusy(false);
    if (ok) fresh.current.clear();
  }

  return (
    <Drawer
      titleId={titleId}
      onClose={close}
      header={
        <div>
          <h2 id={titleId} className="text-lg font-semibold text-foreground">
            {isNew ? "New resource" : `Edit ${resource.title}`}
          </h2>
          {!isNew && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatDownloads(resource.downloads)} · {resource.stats.people} {resource.stats.people === 1 ? "person" : "people"}
            </p>
          )}
        </div>
      }
      footer={
        <div className="space-y-3">
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            <button type="button" disabled={busy} onClick={() => submit("draft")} className={secondaryButton}>
              {draft.status === "published" ? "Unpublish" : "Save draft"}
            </button>
            <button type="button" disabled={busy} onClick={() => submit("published")} className={primaryButton}>
              {busy ? "Saving…" : draft.status === "published" ? "Save" : "Publish"}
            </button>
          </div>
        </div>
      }
    >
      <Field label="Title" htmlFor="store-title" required>
        <Input
          id="store-title"
          value={draft.title}
          maxLength={120}
          placeholder="e.g. 128 BPM house practice loops"
          onChange={(e) => {
            set("title", e.target.value);
            if (!slugTouched) set("slug", slugify(e.target.value));
          }}
        />
      </Field>
      <Field label="URL" htmlFor="store-slug" error={slugTaken ? "Another resource already uses this URL." : undefined} hint={draft.slug ? `/store/${draft.slug}` : "Made from the title"}>
        <Input
          id="store-slug"
          value={draft.slug}
          onChange={(e) => {
            setSlugTouched(true);
            set("slug", slugify(e.target.value));
          }}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Category" htmlFor="store-category">
          <Select id="store-category" value={draft.category} onChange={(e) => set("category", e.target.value)}>
            {storeCategories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Who can download" htmlFor="store-access">
          <Select id="store-access" value={draft.access} onChange={(e) => set("access", e.target.value as StudioStoreResource["access"])}>
            <option value="warm-up">Free (any member)</option>
            <option value="resident">Resident and up</option>
            <option value="headliner">Headliner only</option>
          </Select>
        </Field>
      </div>
      <Field label="Made by" htmlFor="store-creator" hint="Shown like a channel under the title.">
        <Select id="store-creator" value={draft.instructorId ?? ""} onChange={(e) => set("instructorId", e.target.value || null)}>
          <option value="">Ultimate Deejays team</option>
          {instructors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </Select>
      </Field>

      <section aria-labelledby={`${titleId}-files`}>
        <div className="flex items-baseline justify-between gap-3">
          <h3 id={`${titleId}-files`} className="text-sm font-medium text-foreground">
            Files <span className="text-red-600 dark:text-red-400">*</span>
          </h3>
          <span className="text-xs text-muted-foreground">
            {draft.files.length} {draft.files.length === 1 ? "file" : "files"}
            {totalSize(draft) ? ` · ${formatSize(totalSize(draft))}` : ""}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">Several files download as one ZIP. Students can also take them one at a time.</p>

        {draft.files.length > 0 && (
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
            {draft.files.map((file, i) => {
              const Icon = file.kind === "link" ? LinkIcon : fileIcons[fileKind(file)];
              return (
                <li key={file.id} className="flex items-center gap-2 p-2 pl-3">
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <input
                    aria-label="File name"
                    value={file.name}
                    onChange={(e) => setDraft((d) => ({ ...d, files: d.files.map((f) => (f.id === file.id ? { ...f, name: e.target.value } : f)) }))}
                    className="min-w-0 flex-1 rounded-md bg-transparent px-1.5 py-1 text-sm text-foreground outline-none focus:bg-muted"
                  />
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{file.kind === "link" ? "Link" : formatSize(file.size)}</span>
                  <span className="flex shrink-0">
                    <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${file.name} up`} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5 disabled:opacity-30">
                      <ChevronDownIcon className="size-4 rotate-180" />
                    </button>
                    <button type="button" disabled={i === draft.files.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${file.name} down`} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5 disabled:opacity-30">
                      <ChevronDownIcon className="size-4" />
                    </button>
                    <button type="button" onClick={() => removeFile(file)} aria-label={`Remove ${file.name}`} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-600">
                      <TrashIcon className="size-4" />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {uploading.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground" aria-live="polite">
            {uploading.map((name) => (
              <li key={name} className="flex items-center gap-2">
                <span aria-hidden="true" className="size-3.5 animate-spin rounded-full border-2 border-foreground/20 border-t-brand" />
                Uploading {name}…
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <input ref={fileRef} type="file" multiple className="sr-only" id="store-upload" onChange={(e) => upload(e.target.files)} />
          <label htmlFor="store-upload" className={`${secondaryButton} cursor-pointer`}>
            <PlusIcon className="size-4" /> Upload files
          </label>
          <button type="button" onClick={() => setLinkOpen((o) => !o)} aria-expanded={linkOpen} className={secondaryButton}>
            <LinkIcon className="size-4" /> Add a link
          </button>
        </div>
        {linkOpen && (
          <LinkForm
            onAdd={(file) => {
              setDraft((d) => ({ ...d, files: [...d.files, file] }));
              setLinkOpen(false);
            }}
          />
        )}
        <p className="mt-2 text-xs text-muted-foreground">Uploads go to your private store bucket (50 MB per file on Supabase&apos;s free plan). For bigger packs, add a Google Drive or Dropbox link.</p>
      </section>

      <Field label="Thumbnail" htmlFor="store-thumb" hint="16:9 works best, like a video thumbnail. Without one, the store draws a cover from the category.">
        <ThumbnailPicker id="store-thumb" folder="store" size={{ width: 1280, height: 720 }} value={draft.thumbnail} onChange={(src) => set("thumbnail", src)} />
      </Field>
      <Field label="Preview video" htmlFor="store-preview" error={previewBad ? "Paste a YouTube link." : undefined} hint="Optional YouTube link shown on the resource page instead of the thumbnail.">
        <Input id="store-preview" value={draft.previewUrl} placeholder="https://youtu.be/…" onChange={(e) => set("previewUrl", e.target.value.trim())} />
      </Field>
      <Field label="Description" htmlFor="store-description" hint="What's inside and how to use it.">
        <Textarea id="store-description" rows={6} maxLength={5000} value={draft.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <Switch id="store-featured" label="Featured" hint="Pinned to the front of the store with a Featured badge." checked={draft.featured} onChange={(on) => set("featured", on)} />
    </Drawer>
  );
}

function LinkForm({ onAdd }: { onAdd: (file: StudioStoreFile) => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [sizeMb, setSizeMb] = useState("");
  const valid = name.trim() && /^(https?:\/\/|\/(?!\/))\S+$/.test(url.trim());
  return (
    <div className="mt-3 space-y-3 rounded-xl border border-border bg-muted/40 p-3">
      <Field label="File name" htmlFor="link-name">
        <Input id="link-name" value={name} placeholder="e.g. Full sample pack.zip" onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Link" htmlFor="link-url" hint="A direct download link works best. Google Drive and Dropbox links open their page.">
        <Input id="link-url" value={url} placeholder="https://" onChange={(e) => setUrl(e.target.value)} />
      </Field>
      <Field label="Size (MB, optional)" htmlFor="link-size">
        <Input id="link-size" type="number" min={0} step="0.1" value={sizeMb} onChange={(e) => setSizeMb(e.target.value)} />
      </Field>
      <button
        type="button"
        disabled={!valid}
        onClick={() => onAdd({ id: crypto.randomUUID(), name: name.trim(), kind: "link", path: "", url: url.trim(), size: Math.round((Number(sizeMb) || 0) * 1024 * 1024), mime: "" })}
        className={`${primaryButton} h-9`}
      >
        Add link
      </button>
    </div>
  );
}

