const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** True when every word of the query appears somewhere in the fields (case- and accent-insensitive). */
export function matchesQuery(fields: string[], query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = normalize(fields.join(" "));
  return words.every((word) => haystack.includes(word));
}

/** Next's `searchParams` object as URLSearchParams, keeping the first value of repeated keys. */
export function toSearchParams(record: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) params.set(key, first);
  }
  return params;
}
