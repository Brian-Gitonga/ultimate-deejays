"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { courseCategories, type CategorySlug, type CourseCategory, type SubcategorySlug } from "@/lib/course-taxonomy";
import { plans } from "@/lib/plans";
import { listMedia, uploadMedia } from "@/app/(studio)/studio/media/actions";
import type { MediaFolder } from "@/lib/media";
import { runAction } from "@/lib/studio-store";
import { thumbnailLibrary, type AccessPlan, type InstructorOption } from "@/lib/studio-courses";
import { CameraIcon, CheckIcon, CloseIcon, ImageIcon } from "../icons";
import { Select } from "./ui";

/** "genres/house-techno" <-> { category, subcategory } */
export function CategorySelect({
  id,
  category,
  subcategory,
  onChange,
  invalid,
}: {
  id: string;
  category: CategorySlug | "";
  subcategory: SubcategorySlug | "";
  onChange: (category: CategorySlug | "", subcategory: SubcategorySlug | "") => void;
  invalid?: boolean;
}) {
  const value = subcategory ? `${category}/${subcategory}` : category;
  return (
    <Select
      id={id}
      value={value}
      aria-invalid={invalid || undefined}
      onChange={(e) => {
        const [cat, sub] = e.target.value.split("/");
        onChange((cat ?? "") as CategorySlug | "", (sub ?? "") as SubcategorySlug | "");
      }}
    >
      <option value="">Select a category</option>
      {(courseCategories as readonly CourseCategory[]).map((c) =>
        c.children ? (
          <optgroup key={c.slug} label={c.name}>
            <option value={c.slug}>{c.name} (general)</option>
            {c.children.map((child) => (
              <option key={child.slug} value={`${c.slug}/${child.slug}`}>
                {child.name}
              </option>
            ))}
          </optgroup>
        ) : (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ),
      )}
    </Select>
  );
}

export function AccessPicker({ value, onChange }: { value: AccessPlan; onChange: (plan: AccessPlan) => void }) {
  return (
    <div role="radiogroup" aria-label="Who can access this course" className="grid gap-3 sm:grid-cols-3">
      {plans.map((plan) => {
        const checked = value === plan.slug;
        return (
          <label
            key={plan.slug}
            className={`relative cursor-pointer rounded-xl border p-4 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/20 ${
              checked ? "border-brand bg-brand/[0.06]" : "border-border hover:border-foreground/25"
            }`}
          >
            <input type="radio" name="access" value={plan.slug} checked={checked} onChange={() => onChange(plan.slug)} className="sr-only" />
            <span className="block text-sm font-semibold text-foreground">{plan.name}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {plan.price ? `Included in the $${plan.price} plan${plan.slug === "resident" ? " and Headliner" : ""}` : "Free for every student"}
            </span>
            {checked && <CheckIcon className="absolute top-3.5 right-3.5 size-4 text-brand" strokeWidth={3} />}
          </label>
        );
      })}
    </div>
  );
}

/** Crops an image file to a fixed shape (course cards are 10:7) and returns it as a JPEG. */
export async function cropToJpeg(file: File, width = 960, height = 672): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.max(width / bitmap.width, height / bitmap.height);
  const w = width / scale;
  const h = height / scale;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, (bitmap.width - w) / 2, (bitmap.height - h) / 2, w, h, 0, 0, width, height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("crop failed"))), "image/jpeg", 0.85));
}

/** Uploads a cropped image to the media library. Resolves to its public URL, or null (the error shows in the banner). */
export async function uploadCroppedImage(file: File, folder: MediaFolder, size: { width: number; height: number }) {
  const blob = await cropToJpeg(file, size.width, size.height);
  const body = new FormData();
  body.set("file", new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" }));
  body.set("folder", folder);
  body.set("width", String(size.width));
  body.set("height", String(size.height));
  const result = await runAction(() => uploadMedia(body));
  return result.ok ? result.record.url : null;
}

/*
 * Image field for courses, posts, challenges and instructors: upload (cropped
 * in the browser, stored in the media library), pick from the library, or remove.
 */
export function ThumbnailPicker({
  id,
  value,
  onChange,
  invalid,
  folder = "courses",
  size = { width: 960, height: 672 },
}: {
  id: string;
  value: string;
  onChange: (src: string) => void;
  invalid?: boolean;
  folder?: MediaFolder;
  size?: { width: number; height: number };
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [library, setLibrary] = useState<string[] | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) return setError("Choose a JPG, PNG or WebP image.");
    if (file.size > 20 * 1024 * 1024) return setError("That image is over 20 MB.");
    setBusy(true);
    try {
      const url = await uploadCroppedImage(file, folder, size);
      if (url) {
        onChange(url);
        setLibrary(null);
      }
    } catch {
      setError("We couldn't read that image. Try another file.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleLibrary() {
    const next = !open;
    setOpen(next);
    if (next && !library) {
      const result = await runAction(() => listMedia(true));
      setLibrary([...(result.ok ? result.record.map((a) => a.url) : []), ...thumbnailLibrary]);
    }
  }

  return (
    <div>
      <div
        className={`flex flex-col gap-4 rounded-xl border border-dashed p-3 sm:flex-row sm:items-center ${invalid ? "border-red-500" : "border-border"}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload(e.dataTransfer.files[0]);
        }}
      >
        <div
          className={`relative w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-44 ${busy ? "animate-pulse" : ""}`}
          style={{ aspectRatio: `${size.width} / ${size.height}` }}
        >
          {value ? (
            <Image src={value} alt="Image preview" fill sizes="176px" unoptimized={value.startsWith("data:")} className="object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-7" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium text-foreground">{busy ? "Uploading…" : "Drag an image here, or"}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              id={id}
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 font-medium text-foreground hover:bg-muted disabled:opacity-60"
            >
              <CameraIcon className="size-4" /> Upload image
            </button>
            <button
              type="button"
              onClick={toggleLibrary}
              aria-expanded={open}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 font-medium text-foreground hover:bg-muted"
            >
              <ImageIcon className="size-4" /> Use from library
            </button>
            {value && (
              <button type="button" onClick={() => onChange("")} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-muted-foreground hover:text-foreground">
                <CloseIcon className="size-4" /> Remove
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            JPG, PNG or WebP. Cropped to {size.width}×{size.height} and saved to the media library.
          </p>
          {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => upload(e.target.files?.[0])} />
      </div>

      {open && (
        <div className="mt-3">
          {library === null ? (
            <p className="text-sm text-muted-foreground">Loading the library…</p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {library.map((src) => (
                <li key={src}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(src);
                      setOpen(false);
                    }}
                    aria-pressed={value === src}
                    aria-label={`Use ${decodeURIComponent(src.split("/").pop() ?? "image")}`}
                    className={`relative block aspect-[10/7] w-full overflow-hidden rounded-lg ring-2 transition ${
                      value === src ? "ring-brand" : "ring-transparent hover:ring-foreground/20"
                    }`}
                  >
                    <Image src={src} alt="" fill sizes="140px" className="object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Picks a course's instructor or a blog post's author. */
export function InstructorSelect({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: string | null;
  options: InstructorOption[];
  onChange: (option: InstructorOption | null) => void;
}) {
  return (
    <Select id={id} value={value ?? ""} onChange={(e) => onChange(options.find((o) => o.id === e.target.value) ?? null)}>
      <option value="">The Ultimate Deejays team</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
          {o.specialty ? ` · ${o.specialty}` : ""}
        </option>
      ))}
    </Select>
  );
}
