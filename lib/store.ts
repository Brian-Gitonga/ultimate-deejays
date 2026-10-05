/*
 * The store: downloadable resources (practice tracks, sample packs, stems,
 * cue sheets, presets, templates, artwork). Browsing is public; downloading
 * needs an account, and each resource has a plan like courses do (warm-up =
 * free). Loaded by lib/db/store.ts, downloaded through /api/store/download.
 */

export type StorePlan = "warm-up" | "resident" | "headliner";

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
  /** The lowest plan that can download it */
  access: StorePlan;
  creator: { name: string; image: string | null };
  featured: boolean;
  downloads: number;
  publishedAt: string;
  files: StoreFile[];
  totalSize: number;
};

const PLAN_RANK: Record<StorePlan, number> = { "warm-up": 0, resident: 1, headliner: 2 };

/** Whether someone on `plan` (or an admin) can download a resource needing `access`. */
export const canDownload = (access: StorePlan, plan: StorePlan, isAdmin = false) => isAdmin || PLAN_RANK[plan] >= PLAN_RANK[access];

export const planLabel = (plan: StorePlan) => (plan === "warm-up" ? "Free" : plan === "resident" ? "Resident" : "Headliner");

/** "Kick Drum.WAV" → "WAV" */
export function fileExt(name: string) {
  const match = /\.([a-z0-9]{1,6})$/i.exec(name);
  return match ? match[1].toUpperCase() : "FILE";
}

export type FileKind = "audio" | "image" | "document" | "archive" | "video" | "other";

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
  access: StorePlan;
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
};

/** Where an upload goes in the store bucket: resources/<resource id>/<random>-<name>. */
export const storagePathFor = (resourceId: string, fileName: string) =>
  `resources/${resourceId}/${crypto.randomUUID().slice(0, 8)}-${fileName.replace(/[^\w.-]+/g, "-").replace(/^-+/, "").slice(-120) || "file"}`;
