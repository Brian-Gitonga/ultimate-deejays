/* Media library types and limits, shared by the studio pages and the upload action. */

export const mediaFolders = [
  { slug: "general", name: "General" },
  { slug: "courses", name: "Course images" },
  { slug: "blog", name: "Blog covers" },
  { slug: "challenges", name: "Challenge images" },
  { slug: "instructors", name: "Instructor photos" },
  { slug: "resources", name: "Lesson resources" },
  { slug: "store", name: "Store thumbnails" },
] as const;

export type MediaFolder = (typeof mediaFolders)[number]["slug"];

export type MediaAsset = {
  id: string;
  url: string;
  path: string;
  name: string;
  alt: string;
  folder: MediaFolder;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
};

export const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
export const MEDIA_MAX_BYTES = 10 * 1024 * 1024;

export const isImage = (asset: Pick<MediaAsset, "mimeType">) => asset.mimeType.startsWith("image/");

/** 1536000 → "1.5 MB" */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
