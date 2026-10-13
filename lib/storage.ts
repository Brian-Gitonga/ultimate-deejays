/*
 * Where store files are kept. A file's path says which storage holds it, the
 * way a web address starts with https://: "r2:resources/…" is in Cloudflare
 * R2, a plain "resources/…" is in Supabase Storage's private store bucket
 * (everything uploaded before R2 was added). Another provider later is a new
 * prefix here and in lib/storage.server.ts.
 */

export type StorageProvider = "r2" | "supabase";

export const storageProviders: Record<StorageProvider, { name: string; short: string; hint: string; maxBytes: number }> = {
  r2: { name: "Cloudflare R2", short: "R2", hint: "Up to 5 GB per file, with no download fees.", maxBytes: 5 * 1024 ** 3 },
  supabase: { name: "Supabase Storage", short: "Supabase", hint: "Up to 50 MB per file on Supabase's free plan.", maxBytes: 50 * 1024 ** 2 },
};

const R2_PREFIX = "r2:";

export const providerOf = (path: string): StorageProvider => (path.startsWith(R2_PREFIX) ? "r2" : "supabase");

/** The object's key inside its storage: the path without the provider prefix. */
export const objectKey = (path: string) => (path.startsWith(R2_PREFIX) ? path.slice(R2_PREFIX.length) : path);

/** A stored file's path for `provider`. */
export const pathFor = (provider: StorageProvider, key: string) => (provider === "r2" ? `${R2_PREFIX}${key}` : key);

/** A store file's path, in any provider (what saving a resource accepts). */
export const isStorePath = (path: string) => objectKey(path).startsWith("resources/");
