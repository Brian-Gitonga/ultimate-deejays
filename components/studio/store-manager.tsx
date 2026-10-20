"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { deleteStoreResource, discardStoreUploads, saveStoreResource, startR2Upload, studioPreviewVideoUrl } from "@/app/(studio)/studio/store/actions";
import { youtubeId } from "@/lib/curriculum";
import { optimizePreviewVideo, PREVIEW_ENCODING } from "@/lib/video-optimize";
import { providerOf, storageProviders, type StorageProvider } from "@/lib/storage";
import { PREVIEW_VIDEO_GOOD_BYTES, PREVIEW_VIDEO_MAX_BYTES, PREVIEW_VIDEO_TYPES, formatDownloads, formatSize, planLabel, resourcePath, storagePathFor, storeCategories, categoryName, fileKind, type StudioStoreFile, type StudioStoreResource } from "@/lib/store";
import { slugify, type InstructorOption } from "@/lib/studio-courses";
import { reportStudioError, useServerCollection } from "@/lib/studio-store";
import { createClient } from "@/lib/supabase/client";
import { ArrowUpRightIcon, ChevronDownIcon, DownloadIcon, LinkIcon, PencilIcon, PlayIcon, PlusIcon, TrashIcon, TrendUpIcon, UsersIcon } from "../icons";
import { fileIcons, StoreCover } from "../store/store-cover";
import { EditFormBuilder } from "./edit-form-builder";
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
  previewVideo: "",
  heroFeatured: false,
  access: "warm-up",
  lowerThird: false,
  instructorId: null,
  status: "draft",
  featured: false,
  downloads: 0,
  stats: { total: 0, last30: 0, people: 0, lastAt: null },
  isDemo: false,
  publishedAt: null,
  updatedAt: new Date().toISOString(),
  files: [],
  editsEnabled: false,
  editTurnaround: "",
  editForm: [],
});

const totalSize = (r: Pick<StudioStoreResource, "files">) => r.files.reduce((s, f) => s + f.size, 0);

/*
 * Studio → Store: the downloads on /store. Add a resource, upload its files
 * (they go straight to the private store bucket) or add links for files
 * hosted elsewhere, pick who can download it, and publish. Turn on "Lower
 * third" to list it on /lower-thirds as well.
 */
export function StoreManager({ seed, instructors, storage }: { seed: StudioStoreResource[]; instructors: InstructorOption[]; /** Storages uploads can go to, preferred first */ storage: StorageProvider[] }) {
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
          { key: "lower-thirds", label: "Lower thirds", test: (r: StudioStoreResource) => r.lowerThird },
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
                    {r.lowerThird && <span className="shrink-0 rounded bg-brand/10 px-1.5 py-0.5 text-[0.6875rem] font-medium text-brand-deep dark:text-brand">Lower third</span>}
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
              r.status === "published" && { label: "View on site", icon: ArrowUpRightIcon, href: resourcePath(r.slug, r.lowerThird), external: true },
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
          storage={storage}
          taken={items.filter((r) => r.id !== editing.id).map((r) => r.slug)}
          onClose={() => setEditing(null)}
          onSave={async (next) => {
            const saved = await save(next);
            if (saved) {
              setEditing(null);
              show(saved.status === "published" ? `${saved.title} is live ${saved.lowerThird ? "on Lower thirds" : "in the store"}` : `${saved.title} saved as a draft`);
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

type Upload = { key: string; name: string; /** 0–1, or null when the storage doesn't report it */ progress: number | null };

const PROVIDER_KEY = "studio-store-storage";

/* Sends one file to R2 through a signed link, reporting progress. Resolves to its path, or null (the error is shown). */
async function uploadToR2(resourceId: string, file: File, onProgress: (share: number) => void): Promise<string | null> {
  const start = await startR2Upload({ resourceId, name: file.name, size: file.size }).catch(() => null);
  if (!start?.ok) {
    reportStudioError(start?.error ?? `Couldn't start uploading “${file.name}”. Check your connection and try again.`);
    return null;
  }
  const { url, path } = start.record;
  const ok = await new Promise<boolean>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.send(file);
  });
  if (!ok) {
    reportStudioError(`Couldn't upload “${file.name}” to Cloudflare R2. If this keeps happening, check that the bucket's CORS policy allows uploads from this site (see .env.example).`);
    return null;
  }
  return path;
}

/* Sends one file to the Supabase store bucket. Resolves to its path, or null (the error is shown). */
async function uploadToSupabase(resourceId: string, file: File): Promise<string | null> {
  const path = storagePathFor(resourceId, file.name);
  const { error } = await createClient().storage.from("store").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (!error) return path;
  const tooBig = /exceeded|too large|payload/i.test(error.message);
  reportStudioError(
    tooBig
      ? `“${file.name}” is bigger than your Supabase upload limit (50 MB on the free plan). Switch “Store uploads in” to Cloudflare R2, or add it as a link.`
      : `Couldn't upload “${file.name}”: ${error.message}. Check that migration 014 has been run.`,
  );
  return null;
}

/*
 * The clip that plays when someone rests the mouse on the cover, and at the
 * top of the resource's page. Uploaded straight to storage like the files;
 * watched here from the computer (just uploaded) or a signed link (saved).
 */
function PreviewVideoField({
  resourceId,
  value,
  provider,
  hasThumbnail,
  onChange,
  onUploadingChange,
}: {
  resourceId: string;
  value: string;
  provider: StorageProvider;
  hasThumbnail: boolean;
  onChange: (path: string) => void;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  // Just uploaded: played from the file itself. Saved: from a signed link.
  const [local, setLocal] = useState<{ path: string; url: string; name: string; size: number; note: string } | null>(null);
  const [remote, setRemote] = useState<{ path: string; url: string } | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  // Optimising (in this browser) comes before uploading.
  const [sending, setSending] = useState<false | "optimizing" | "uploading">(false);
  const [problem, setProblem] = useState("");
  const src = local?.path === value ? local.url : remote?.path === value ? remote.url : "";

  useEffect(() => {
    if (!value || local?.path === value || remote?.path === value) return;
    let cancelled = false;
    studioPreviewVideoUrl(value).then(
      (result) => !cancelled && (result.ok ? setRemote({ path: value, url: result.record }) : setProblem(result.error)),
      () => !cancelled && setProblem("Couldn't load the preview video."),
    );
    return () => {
      cancelled = true;
    };
  }, [value, local, remote]);

  // The file's address in this tab is let go when it's replaced or the drawer closes.
  useEffect(() => () => {
    if (local) URL.revokeObjectURL(local.url);
  }, [local]);

  async function pick(file: File | undefined) {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setProblem("");
    if (!file.type.startsWith("video/")) return setProblem("That isn't a video. Export an MP4, MOV or WebM clip.");
    if (file.size > 2 * 1024 ** 3) return setProblem(`That clip is ${formatSize(file.size)}. Export a shorter clip (under 2 GB).`);
    onUploadingChange(true);

    // 1. Shrink it here, so every visitor downloads a small, quick-starting file.
    setSending("optimizing");
    setProgress(0);
    const result = await optimizePreviewVideo(file, setProgress).catch((error: unknown) => {
      console.error("[preview video] optimising", error);
      return null;
    });
    const ready = result?.file ?? file;
    const fail = (message: string) => {
      onUploadingChange(false);
      setSending(false);
      setProgress(null);
      setProblem(message);
    };
    if (!result?.optimized && !PREVIEW_VIDEO_TYPES.includes(ready.type)) return fail("This browser can't convert that video. Export it as an MP4 (H.264), or use Chrome or Edge, which convert it for you.");
    if (ready.size > PREVIEW_VIDEO_MAX_BYTES) return fail(`That clip is ${formatSize(ready.size)}. Preview videos can be up to ${formatSize(PREVIEW_VIDEO_MAX_BYTES)}: export a shorter clip.`);

    // 2. Upload the light version.
    setSending("uploading");
    setProgress(provider === "r2" ? 0 : null);
    const path = provider === "r2" ? await uploadToR2(resourceId, ready, setProgress) : await uploadToSupabase(resourceId, ready);
    onUploadingChange(false);
    setSending(false);
    setProgress(null);
    if (!path) return;
    const note = result?.optimized
      ? `Optimised for fast playback: ${formatSize(result.before)} → ${formatSize(result.after)}${result.trimmed ? `, first ${PREVIEW_ENCODING.maxSeconds} seconds` : ""}.`
      : "Uploaded as it is: this browser can't optimise video (Chrome or Edge can).";
    setLocal({ path, url: URL.createObjectURL(ready), name: ready.name, size: ready.size, note });
    onChange(path);
  }

  const large = local?.path === value && local.size > PREVIEW_VIDEO_GOOD_BYTES;

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground">Preview video</p>
      <input ref={inputRef} id="store-preview-video" type="file" accept="video/*" className="sr-only" aria-describedby={hintId} onChange={(e) => pick(e.target.files?.[0])} />
      {value && !sending ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="relative aspect-video w-full max-w-xs shrink-0 overflow-hidden rounded-xl bg-neutral-900">
            {src ? (
              <video key={src} src={src} muted loop autoPlay playsInline preload="metadata" className="size-full object-cover" aria-label="Preview video" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-xs text-white/60">{problem || "Loading…"}</span>
            )}
          </div>
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium text-foreground">{local?.path === value ? local.name : "Preview video"}</p>
            <p className="text-xs text-muted-foreground">
              {local?.path === value ? `${formatSize(local.size)} · ` : ""}
              {storageProviders[providerOf(value)].name}
            </p>
            {local?.path === value && <p className="mt-1 text-xs text-brand-deep dark:text-brand">{local.note}</p>}
            <div className="mt-2 flex gap-2">
              <label htmlFor="store-preview-video" className={`${secondaryButton} cursor-pointer`}>
                Replace
              </label>
              <button type="button" onClick={() => onChange("")} className={`${secondaryButton} text-red-600 hover:bg-red-500/10 dark:text-red-400`}>
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : sending ? (
        <div className="max-w-xs rounded-xl border border-border p-4" aria-live="polite">
          <p className="flex items-center justify-between text-sm text-foreground">
            {sending === "optimizing" ? "Optimising for fast playback…" : "Uploading the clip…"}
            {progress !== null && <span className="tabular-nums text-muted-foreground">{Math.round(progress * 100)}%</span>}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{sending === "optimizing" ? "Step 1 of 2 · keep this tab open" : "Step 2 of 2"}</p>
          {progress !== null && (
            <span role="progressbar" aria-label={sending === "optimizing" ? "Optimising the preview video" : "Uploading the preview video"} aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} className="mt-2 block h-1.5 overflow-hidden rounded-full bg-foreground/[0.07]">
              <span className="block h-full rounded-full bg-brand transition-[width]" style={{ width: `${progress * 100}%` }} />
            </span>
          )}
        </div>
      ) : (
        <label
          htmlFor="store-preview-video"
          className="flex max-w-md cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border px-4 py-4 text-sm transition hover:bg-foreground/[0.03]"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <PlayIcon className="size-4" />
          </span>
          <span>
            <span className="block font-medium text-foreground">Upload a preview clip</span>
            <span className="text-xs text-muted-foreground">MP4, MOV or WebM · we optimise it for you</span>
          </span>
        </label>
      )}
      {problem && !value && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{problem}</p>}
      {large && <p className="mt-2 text-sm text-[#9a6400] dark:text-accent-amber">This clip is {formatSize(local!.size)}, so it may start late on hover. A shorter clip loads faster.</p>}
      {value && !hasThumbnail && <p className="mt-2 text-sm text-[#9a6400] dark:text-accent-amber">Add a thumbnail above too: it shows while the clip loads, and on phones.</p>}
      <p id={hintId} className="mt-2 text-xs text-muted-foreground">
        Optional. Plays (muted) when someone rests the mouse on the cover, and at the top of its page. 5–15 seconds is ideal. Before uploading, it&apos;s resized to 540p, the sound is removed and it&apos;s cut to {PREVIEW_ENCODING.maxSeconds} seconds, so it starts fast even on slow connections. Saved to the storage chosen under Files.
      </p>
    </div>
  );
}

function ResourceDrawer({
  resource,
  instructors,
  storage,
  taken,
  onClose,
  onSave,
}: {
  resource: StudioStoreResource;
  instructors: InstructorOption[];
  storage: StorageProvider[];
  taken: string[];
  onClose: () => void;
  onSave: (next: StudioStoreResource) => Promise<boolean>;
}) {
  const titleId = useId();
  const isNew = !resource.title;
  const [draft, setDraft] = useState(resource);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<Upload[]>([]);
  const [videoUploading, setVideoUploading] = useState(false);
  // Where new uploads go: the last choice on this computer, else the first available.
  const [provider, setProvider] = useState<StorageProvider>(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(PROVIDER_KEY);
    } catch {}
    return storage.find((p) => p === saved) ?? storage[0] ?? "supabase";
  });
  const chooseProvider = (next: StorageProvider) => {
    setProvider(next);
    try {
      localStorage.setItem(PROVIDER_KEY, next);
    } catch {}
  };
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
    discardStoreUploads(paths).catch(() => {});
  }, []);

  const close = useCallback(() => {
    discardFresh([...fresh.current]);
    onClose();
  }, [discardFresh, onClose]);

  async function upload(list: FileList | null) {
    if (!list?.length) return;
    setError("");
    const into = provider;
    for (const file of Array.from(list)) {
      const key = crypto.randomUUID();
      const progress = (value: number) => setUploading((u) => u.map((x) => (x.key === key ? { ...x, progress: value } : x)));
      setUploading((u) => [...u, { key, name: file.name, progress: into === "r2" ? 0 : null }]);
      const path = into === "r2" ? await uploadToR2(draft.id, file, progress) : await uploadToSupabase(draft.id, file);
      setUploading((u) => u.filter((x) => x.key !== key));
      if (!path) continue;
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
    if (uploading.length || videoUploading) return setError("Wait for the uploads to finish.");
    if (draft.previewVideo && !draft.thumbnail) return setError("Add a thumbnail too: it shows while the preview video loads, and on phones.");
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
      <Field label="URL" htmlFor="store-slug" error={slugTaken ? "Another resource already uses this URL." : undefined} hint={draft.slug ? resourcePath(draft.slug, draft.lowerThird) : "Made from the title"}>
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
                  {file.kind === "storage" && (
                    <span title={`Stored in ${storageProviders[providerOf(file.path)].name}`} className="shrink-0 rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
                      {storageProviders[providerOf(file.path)].short}
                    </span>
                  )}
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
            {uploading.map((u) => (
              <li key={u.key}>
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-foreground/20 border-t-brand motion-reduce:animate-none" />
                  <span className="min-w-0 flex-1 truncate">Uploading {u.name}…</span>
                  {u.progress !== null && <span className="shrink-0 tabular-nums">{Math.round(u.progress * 100)}%</span>}
                </span>
                {u.progress !== null && (
                  <span
                    role="progressbar"
                    aria-label={`Uploading ${u.name}`}
                    aria-valuenow={Math.round(u.progress * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="mt-1 block h-1 overflow-hidden rounded-full bg-foreground/[0.07]"
                  >
                    <span className="block h-full rounded-full bg-brand transition-[width]" style={{ width: `${u.progress * 100}%` }} />
                  </span>
                )}
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
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <label htmlFor="store-provider" className="text-xs font-medium text-foreground">
            Store uploads in
          </label>
          <div className="w-48">
            <Select id="store-provider" value={provider} onChange={(e) => chooseProvider(e.target.value as StorageProvider)} className="h-9 text-sm">
              {storage.map((p) => (
                <option key={p} value={p}>
                  {storageProviders[p].name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {storageProviders[provider].hint} Files already added stay where they are.
          {!storage.includes("r2") && " To use Cloudflare R2, add its keys to .env (see .env.example)."}
        </p>
      </section>

      <Field label="Thumbnail" htmlFor="store-thumb" hint="16:9 works best, like a video thumbnail. Without one, the store draws a cover from the category.">
        <ThumbnailPicker id="store-thumb" folder="store" size={{ width: 1280, height: 720 }} value={draft.thumbnail} onChange={(src) => set("thumbnail", src)} />
      </Field>
      <PreviewVideoField
        resourceId={draft.id}
        value={draft.previewVideo}
        provider={provider}
        hasThumbnail={!!draft.thumbnail}
        onUploadingChange={setVideoUploading}
        onChange={(path) => {
          // A clip uploaded in this drawer and replaced before saving is deleted now; a saved one goes when you save.
          const previous = draft.previewVideo;
          if (previous && fresh.current.has(previous)) discardFresh([previous]);
          if (path) fresh.current.add(path);
          set("previewVideo", path);
        }}
      />
      <Field label="YouTube video" htmlFor="store-preview" error={previewBad ? "Paste a YouTube link." : undefined} hint="Optional. Shown on the resource page when there's no preview video above.">
        <Input id="store-preview" value={draft.previewUrl} placeholder="https://youtu.be/…" onChange={(e) => set("previewUrl", e.target.value.trim())} />
      </Field>
      <Field label="Description" htmlFor="store-description" hint="What's inside and how to use it.">
        <Textarea id="store-description" rows={6} maxLength={5000} value={draft.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <Switch
        id="store-lower-third"
        label="Lower third"
        hint="Lists it on the Lower thirds page too, where its page moves to /lower-thirds."
        checked={draft.lowerThird}
        onChange={(on) => set("lowerThird", on)}
      />
      {draft.lowerThird && (
        <Switch
          id="store-hero"
          label="Show in the Lower thirds hero"
          hint={
            draft.previewVideo
              ? "Plays in the carousel at the top of /lower-thirds, on its own (no hover needed)."
              : "Plays in the carousel at the top of /lower-thirds. Add a preview video above: without one it shows its thumbnail."
          }
          checked={draft.heroFeatured}
          onChange={(on) => set("heroFeatured", on)}
        />
      )}
      <EditFormBuilder value={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />
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

