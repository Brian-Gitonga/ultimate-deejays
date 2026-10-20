/*
 * The store: downloadable resources (practice tracks, sample packs, stems,
 * cue sheets, presets, templates, artwork). Browsing is public; downloading
 * needs an account, and each resource has a plan like courses do (warm-up =
 * free). Loaded by lib/db/store.ts, downloaded through /api/store/download.
 *
 * Lower thirds (on-screen name and title graphics) are store resources with
 * the lower-third switch on: they're listed on /lower-thirds too, and their
 * page lives there instead of under /store.
 */

import type { EditField } from "./edits";
import { includesPlan, type ContentPlan, type PlanSlug } from "./plan-tiers";

/** The lowest plan a store item needs (Lifetime gets everything). */
export type StorePlan = ContentPlan;

export const storeCategories = [
  { slug: "practice-tracks", name: "Practice tracks" },
  { slug: "sample-packs", name: "Sample packs" },
  { slug: "stems", name: "Stems & acapellas" },
  { slug: "cue-sheets", name: "Cue sheets & guides" },
  { slug: "presets", name: "Presets & mappings" },
  { slug: "templates", name: "Templates & press kits" },
  { slug: "artwork", name: "Artwork" },
  { slug: "other", name: "Other" },
] as const;

export type StoreCategory = (typeof storeCategories)[number]["slug"];

export const categoryName = (slug: string) => storeCategories.find((c) => c.slug === slug)?.name ?? "Other";

export type StoreFile = {
  id: string;
  name: string;
  /** Bytes */
  size: number;
  mime: string;
};

export type StoreResource = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  /** Cover image; "" = a generated cover */
  thumbnail: string;
  /** Optional YouTube preview shown on the resource page */
  previewUrl: string;
  /** The uploaded preview clip's address (/api/store/preview/…), or "": plays on hover and on the resource page */
  previewVideo: string;
  /** Picked for the autoplaying carousel at the top of /lower-thirds (migration 019) */
  heroFeatured: boolean;
  /** The lowest plan that can download it */
  access: StorePlan;
  /** Also listed on /lower-thirds, where its page lives */
  lowerThird: boolean;
  creator: { name: string; image: string | null };
  featured: boolean;
  downloads: number;
  publishedAt: string;
  files: StoreFile[];
  totalSize: number;
};

/** "Added" filter: published in the last week, month or year ("" = any time). */
export const addedRanges = [
  { slug: "week", name: "Past week", days: 7 },
  { slug: "month", name: "Past month", days: 30 },
  { slug: "year", name: "Past year", days: 365 },
] as const;

export type StoreAdded = "" | (typeof addedRanges)[number]["slug"];

export type StoreFilters = {
  category: string;
  /** A file kind: resources with at least one file of it */
  type: FileKind | "";
  q: string;
  sort: "popular" | "newest";
  free: boolean;
  added: StoreAdded;
};

export const noFilters: StoreFilters = { category: "", type: "", q: "", sort: "popular", free: false, added: "" };

type SearchParams = Record<string, string | string[] | undefined>;

/** The grid's filters from the page URL (?category=&type=&q=&sort=newest&free=1&added=month), and the cards ticked before logging in (?pick=). */
export function filtersFromSearch(params: SearchParams): { filters: StoreFilters; picked: string[] } {
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
  const category = one(params.category);
  const type = fileKinds.find((k) => k.slug === one(params.type))?.slug ?? "";
  const added = addedRanges.find((a) => a.slug === one(params.added))?.slug ?? "";
  return {
    filters: {
      category: storeCategories.some((c) => c.slug === category) ? category : "",
      type,
      q: one(params.q).slice(0, 80),
      sort: one(params.sort) === "newest" ? "newest" : "popular",
      free: one(params.free) === "1",
      added,
    },
    picked: ([] as string[]).concat(params.pick ?? []).slice(0, 50),
  };
}

/** Where a resource's page lives: /lower-thirds/<slug> for lower thirds, /store/<slug> for the rest. */
export const resourcePath = (slug: string, lowerThird: boolean) => `${lowerThird ? "/lower-thirds" : "/store"}/${slug}`;


/** Whether someone on `plan` (or an admin) can download a resource needing `access`. */
export const canDownload = (access: StorePlan, plan: PlanSlug, isAdmin = false) => isAdmin || includesPlan(plan, access);

export const planLabel = (plan: PlanSlug) => ({ "warm-up": "Free", resident: "Resident", headliner: "Headliner", lifetime: "Lifetime" })[plan];

/** "Kick Drum.WAV" → "WAV" */
export function fileExt(name: string) {
  const match = /\.([a-z0-9]{1,6})$/i.exec(name);
  return match ? match[1].toUpperCase() : "FILE";
}

export type FileKind = "audio" | "image" | "document" | "archive" | "video" | "other";

export const fileKinds: { slug: FileKind; name: string }[] = [
  { slug: "audio", name: "Audio" },
  { slug: "image", name: "Images" },
  { slug: "video", name: "Video" },
  { slug: "document", name: "Documents" },
  { slug: "archive", name: "Archives" },
  { slug: "other", name: "Other files" },
];

export function fileKind(file: Pick<StoreFile, "name" | "mime">): FileKind {
  const ext = fileExt(file.name).toLowerCase();
  if (file.mime.startsWith("audio/") || ["wav", "mp3", "aiff", "aif", "flac", "m4a", "ogg"].includes(ext)) return "audio";
  if (file.mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) return "image";
  if (file.mime.startsWith("video/") || ["mp4", "mov", "webm"].includes(ext)) return "video";
  if (["zip", "rar", "7z"].includes(ext) || file.mime.includes("zip")) return "archive";
  if (file.mime === "application/pdf" || ["pdf", "txt", "doc", "docx", "csv", "xlsx", "md"].includes(ext)) return "document";
  return "other";
}

/** 1536000 → "1.5 MB" */
export function formatSize(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

/** The corner badge on a card, like a video's length: "WAV · 24 MB" or "12 files". */
export function formatBadge(resource: Pick<StoreResource, "files" | "totalSize">) {
  if (resource.files.length === 1) {
    const [file] = resource.files;
    return [fileExt(file.name), formatSize(file.size)].filter(Boolean).join(" · ");
  }
  return `${resource.files.length} files`;
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** 1240 → "1.2K downloads" */
export const formatDownloads = (n: number) => `${n < 1000 ? n.toLocaleString("en-US") : compact.format(n)} ${n === 1 ? "download" : "downloads"}`;

/** "3 weeks ago", relative to `now` (passed in so server and browser agree). */
export function timeAgo(iso: string, now: number) {
  const seconds = Math.max(0, (now - Date.parse(iso)) / 1000);
  const units: [number, string][] = [
    [60 * 60 * 24 * 365, "year"],
    [60 * 60 * 24 * 30, "month"],
    [60 * 60 * 24 * 7, "week"],
    [60 * 60 * 24, "day"],
    [60 * 60, "hour"],
    [60, "minute"],
  ];
  for (const [size, unit] of units) {
    const n = Math.floor(seconds / size);
    if (n >= 1) return `${n} ${unit}${n === 1 ? "" : "s"} ago`;
  }
  return "just now";
}

/** Link to download resources (several = one ZIP), or some files of one resource. */
export function downloadHref(slugs: string[], fileIds: string[] = []) {
  const params = new URLSearchParams();
  for (const slug of slugs) params.append("r", slug);
  for (const id of fileIds) params.append("f", id);
  return `/api/store/download?${params}`;
}

/*
 * A download never reloads the page, so the page can't see it start. Links add
 * ?t=<token>; the download route sets this cookie to the token as the file
 * starts, and the page watches for it to stop saying "Preparing…".
 */
export const DOWNLOAD_COOKIE = "ud-download";

/**
 * Where a resource's preview clip plays from: a route that hands out a signed
 * link (the storage is private). The version changes with the file, so a
 * replaced clip isn't served from the browser's cache.
 */
export const previewVideoHref = (slug: string, path: string) => (path ? `/api/store/preview/${slug}?v=${encodeURIComponent(path.slice(-12))}` : "");

/** Preview clips: what browsers play everywhere, and how big one can be. */
export const PREVIEW_VIDEO_TYPES = ["video/mp4", "video/webm"];
export const PREVIEW_VIDEO_MAX_BYTES = 100 * 1024 * 1024;
/** Above this, a hover preview starts noticeably late. */
export const PREVIEW_VIDEO_GOOD_BYTES = 15 * 1024 * 1024;
export const isDownloadToken = (value: string | null): value is string => !!value && /^[a-z0-9]{8,32}$/.test(value);

// ── Studio ──────────────────────────────────────────────────────────────────

export type StudioStoreFile = {
  id: string;
  name: string;
  /** storage = uploaded to the private store bucket; link = hosted elsewhere */
  kind: "storage" | "link";
  path: string;
  url: string;
  size: number;
  mime: string;
};

export type StudioStoreResource = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  previewUrl: string;
  /** Where the uploaded preview clip lives (r2:… or a store bucket path), or "" (migration 018) */
  previewVideo: string;
  /** In the /lower-thirds hero carousel (migration 019) */
  heroFeatured: boolean;
  access: StorePlan;
  lowerThird: boolean;
  /** null = made by the team */
  instructorId: string | null;
  status: "draft" | "published";
  featured: boolean;
  /** The public count (once per person per day) */
  downloads: number;
  stats: { total: number; last30: number; people: number; lastAt: string | null };
  isDemo: boolean;
  publishedAt: string | null;
  updatedAt: string;
  files: StudioStoreFile[];
  /** Members can ask the team to edit it (migration 016) */
  editsEnabled: boolean;
  /** e.g. "Delivered within 2 working days" */
  editTurnaround: string;
  /** The edit request form */
  editForm: EditField[];
};

/** Where an upload goes in the store bucket: resources/<resource id>/<random>-<name>. */
export const storagePathFor = (resourceId: string, fileName: string) =>
  `resources/${resourceId}/${crypto.randomUUID().slice(0, 8)}-${fileName.replace(/[^\w.-]+/g, "-").replace(/^-+/, "").slice(-120) || "file"}`;
