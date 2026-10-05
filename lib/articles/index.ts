import type { Article } from "./blocks";

export type { Article, Block } from "./blocks";

/* Helpers for rendering an article: headings, table of contents and plain text. */

// Drops the inline marks: "**bold**" -> "bold", "[text](/url)" -> "text".
export const plainText = (text: string) => text.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

export const headingId = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Section headings, for the "On this page" list */
export const tableOfContents = (article: Article) =>
  article.body.flatMap((block) => (block.type === "h2" ? [{ id: headingId(block.text), text: block.text }] : []));
