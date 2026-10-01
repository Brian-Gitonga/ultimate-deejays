import { postCategories, type PostCategory } from "./post-categories";

/* Blog search/category/page state, as it appears in the /blog URL. */
export type BlogFilters = { query: string; category: PostCategory["slug"] | null; page: number };

export function parseFilters(params: URLSearchParams): BlogFilters {
  const category = postCategories.find((c) => c.slug === params.get("category"));
  return {
    query: (params.get("q") ?? "").trim(),
    category: category?.slug ?? null,
    page: Math.max(1, Number.parseInt(params.get("page") ?? "", 10) || 1),
  };
}

export function blogHref({ query, category, page }: BlogFilters) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/blog?${search}` : "/blog";
}
