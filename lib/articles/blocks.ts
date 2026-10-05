/*
 * Article bodies as blocks, rendered by components/article-body.tsx. Posts are
 * stored as Markdown (blog_posts.body) and turned into blocks by lib/markdown.ts.
 * Text supports two inline marks: **bold** and [link text](/path).
 */
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "tip"; title: string; text: string }
  | { type: "quote"; text: string; cite?: string };

export type Article = {
  /** One or two sentences: the article's standfirst, card search text and meta description */
  excerpt: string;
  body: Block[];
};
