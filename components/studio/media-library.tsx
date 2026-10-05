"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { deleteMedia, updateMedia, uploadMedia } from "@/app/(studio)/studio/media/actions";
import { formatBytes, isImage, MEDIA_MAX_BYTES, MEDIA_TYPES, mediaFolders, type MediaAsset, type MediaFolder } from "@/lib/media";
import { matchesQuery } from "@/lib/search";
import { reportStudioError, runAction, useServerCollection } from "@/lib/studio-store";
import { CopyIcon, DownloadIcon, ImageIcon, LessonIcon, PlusIcon, SearchIcon, TrashIcon } from "../icons";
import { Drawer } from "./drawer";
import { ConfirmDialog, useToast } from "./manage-table";
import { Field, Input, Panel, Select, Textarea, primaryButton, secondaryButton } from "./ui";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

async function imageSize(file: File) {
  if (!file.type.startsWith("image/")) return null;
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
}

/*
 * Studio → Media library: every image and PDF uploaded to the site's storage.
 * Upload here (or from any image picker), give images alt text for screen
 * readers, copy a file's URL to use anywhere, and delete what you don't need.
 */
export function MediaLibrary({ seed }: { seed: MediaAsset[] }) {
  const { items, save, remove } = useServerCollection(seed, { save: updateMedia, remove: deleteMedia });
  const [folder, setFolder] = useState<MediaFolder | "all">("all");
  const [uploadFolder, setUploadFolder] = useState<MediaFolder>("general");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<MediaAsset | null>(null);
  const [uploading, setUploading] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const { show, toast } = useToast();

  const open = items.find((a) => a.id === openId) ?? null;
  const shown = items.filter((a) => (folder === "all" || a.folder === folder) && matchesQuery([a.name, a.alt, a.path], query));
  const totalBytes = items.reduce((sum, a) => sum + a.sizeBytes, 0);

  async function upload(files: FileList | File[]) {
    const list = [...files];
    const rejected = list.filter((f) => !MEDIA_TYPES.includes(f.type) || f.size > MEDIA_MAX_BYTES);
    if (rejected.length) reportStudioError(`${rejected.map((f) => f.name).join(", ")}: only JPG, PNG, WebP, GIF or PDF up to 10 MB.`);
    const ok = list.filter((f) => !rejected.includes(f));
    if (!ok.length) return;
    setUploading((n) => n + ok.length);
    let done = 0;
    // One at a time keeps each request under the upload size limit.
    for (const file of ok) {
      const body = new FormData();
      body.set("file", file);
      body.set("folder", uploadFolder);
      const size = await imageSize(file);
      if (size) {
        body.set("width", String(size.width));
        body.set("height", String(size.height));
      }
      const result = await runAction(() => uploadMedia(body));
      if (result.ok) done++;
      setUploading((n) => n - 1);
    }
    if (done) show(`${done} ${done === 1 ? "file" : "files"} uploaded`);
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      show("Link copied");
    } catch {
      show("Couldn't copy the link");
    }
  }

  return (
    <>
      <Panel>
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-8 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            upload(e.dataTransfer.files);
          }}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
            <ImageIcon className="size-6" />
          </span>
          <div>
            <p className="font-semibold text-foreground">{uploading ? `Uploading ${uploading} ${uploading === 1 ? "file" : "files"}…` : "Drop files here to upload"}</p>
            <p className="mt-1 text-sm text-muted-foreground">JPG, PNG, WebP, GIF or PDF, up to 10 MB each. Files are public: anyone with the link can view them.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <label className="sr-only" htmlFor="upload-folder">
              Upload to folder
            </label>
            <Select id="upload-folder" value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value as MediaFolder)} className="h-10 w-auto">
              {mediaFolders.map((f) => (
                <option key={f.slug} value={f.slug}>
                  {f.name}
                </option>
              ))}
            </Select>
            <button type="button" disabled={uploading > 0} onClick={() => fileRef.current?.click()} className={primaryButton}>
              <PlusIcon className="size-4" /> Choose files
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={MEDIA_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              if (e.target.files) upload(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" aria-label="Folders" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
            {[{ slug: "all" as const, name: "All files" }, ...mediaFolders].map((f) => (
              <button
                key={f.slug}
                type="button"
                role="tab"
                aria-selected={folder === f.slug}
                onClick={() => setFolder(f.slug)}
                className={`h-9 shrink-0 rounded-lg px-3 text-sm font-medium transition ${folder === f.slug ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5"}`}
              >
                {f.name}
                <span className="ml-1.5 tabular-nums opacity-70">{f.slug === "all" ? items.length : items.filter((a) => a.folder === f.slug).length}</span>
              </button>
            ))}
          </div>
          <div className="relative sm:w-64">
            <label htmlFor="media-search" className="sr-only">
              Search files
            </label>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="media-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or alt text" className="h-9 pl-9" />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? "file" : "files"} · {formatBytes(totalBytes)}
        </p>

        {shown.length ? (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {shown.map((asset) => (
              <li key={asset.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(asset.id)}
                  className="group block w-full overflow-hidden rounded-xl border border-border bg-muted/40 text-left transition hover:border-foreground/25 focus-visible:ring-4 focus-visible:ring-brand/20 focus-visible:outline-none"
                >
                  <span className="relative block aspect-square bg-muted">
                    {isImage(asset) ? (
                      <Image src={asset.url} alt={asset.alt} fill sizes="200px" className="object-cover transition group-hover:scale-[1.02]" />
                    ) : (
                      <span className="flex size-full items-center justify-center text-muted-foreground">
                        <LessonIcon className="size-8" />
                      </span>
                    )}
                    {isImage(asset) && !asset.alt && (
                      <span className="absolute top-2 left-2 rounded-md bg-amber-500/90 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-neutral-900">No alt text</span>
                    )}
                  </span>
                  <span className="block truncate px-2.5 pt-2 text-xs font-medium text-foreground">{asset.name}</span>
                  <span className="block px-2.5 pb-2 text-[0.6875rem] text-muted-foreground">{formatBytes(asset.sizeBytes)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">{items.length ? "No files match." : "Nothing uploaded yet. Images you upload in any editor appear here too."}</p>
        )}
      </Panel>

      {open && (
        <MediaDrawer
          key={open.id}
          asset={open}
          onClose={() => setOpenId(null)}
          onSave={(next) => save(next).then((saved) => saved && show("Saved"))}
          onCopy={() => copy(open.url)}
          onDelete={() => setConfirm(open)}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title="Delete this file?"
          body={
            <>
              <span className="font-medium text-foreground">{confirm.name}</span> will be deleted from storage. Anything still using its link (a course, post or
              challenge image) will show a broken image.
            </>
          }
          confirmLabel="Delete file"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const asset = confirm;
            setConfirm(null);
            setOpenId(null);
            remove(asset.id).then((done) => done && show("File deleted"));
          }}
        />
      )}
      {toast}
    </>
  );
}

function MediaDrawer({
  asset,
  onClose,
  onSave,
  onCopy,
  onDelete,
}: {
  asset: MediaAsset;
  onClose: () => void;
  onSave: (asset: MediaAsset) => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const titleId = useId();
  const [draft, setDraft] = useState(asset);
  const dirty = draft.name !== asset.name || draft.alt !== asset.alt || draft.folder !== asset.folder;

  return (
    <Drawer
      titleId={titleId}
      onClose={onClose}
      header={
        <>
          <h2 id={titleId} className="truncate text-lg font-semibold text-foreground">
            {asset.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {formatBytes(asset.sizeBytes)}
            {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""} · {dateFormat.format(new Date(asset.createdAt))}
          </p>
        </>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onDelete} className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-red-600 hover:bg-red-500/10 dark:text-red-400">
            <TrashIcon className="size-4" /> Delete
          </button>
          <button type="button" disabled={!dirty} onClick={() => onSave(draft)} className={primaryButton}>
            Save details
          </button>
        </div>
      }
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
        {isImage(asset) ? (
          <Image src={asset.url} alt={asset.alt} fill sizes="448px" className="object-contain" />
        ) : (
          <span className="flex size-full items-center justify-center text-muted-foreground">
            <LessonIcon className="size-10" />
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCopy} className={`${secondaryButton} flex-1`}>
          <CopyIcon className="size-4" /> Copy link
        </button>
        <a href={asset.url} target="_blank" rel="noreferrer" className={`${secondaryButton} flex-1`}>
          <DownloadIcon className="size-4" /> Open
        </a>
      </div>
      <Field label="Name" htmlFor="media-name">
        <Input id="media-name" value={draft.name} maxLength={200} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      </Field>
      {isImage(asset) && (
        <Field label="Alt text" htmlFor="media-alt" hint="Describe the image for people using screen readers. Leave empty for purely decorative images.">
          <Textarea id="media-alt" rows={3} maxLength={300} value={draft.alt} onChange={(e) => setDraft({ ...draft, alt: e.target.value })} />
        </Field>
      )}
      <Field label="Folder" htmlFor="media-folder">
        <Select id="media-folder" value={draft.folder} onChange={(e) => setDraft({ ...draft, folder: e.target.value as MediaFolder })}>
          {mediaFolders.map((f) => (
            <option key={f.slug} value={f.slug}>
              {f.name}
            </option>
          ))}
        </Select>
      </Field>
      <p className="break-all rounded-lg bg-muted/60 p-3 font-mono text-xs text-muted-foreground">{asset.url}</p>
    </Drawer>
  );
}
