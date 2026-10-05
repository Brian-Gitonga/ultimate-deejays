import type { Block } from "./articles/blocks";

/*
 * The small Markdown dialect the studio writes (blog posts, course
 * descriptions), converted to and from article blocks:
 *
 *   ## Heading            ### Sub-heading
 *   - bullet              1. numbered
 *   > **Tip title:** text           (a tip box)
 *   > Quote text                    (a quote; an optional last line
 *   > — Person                       starting with "— " is the credit)
 *
 * Paragraphs are separated by a blank line. Inline **bold** and
 * [link text](/path) are kept as-is and rendered by the article body.
 * blocksToMarkdown(markdownToBlocks(x)) round-trips every article.
 */

export function blocksToMarkdown(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "p":
          return b.text;
        case "h2":
          return `## ${b.text}`;
        case "h3":
          return `### ${b.text}`;
        case "ul":
          return b.items.map((item) => `- ${item}`).join("\n");
        case "ol":
          return b.items.map((item, n) => `${n + 1}. ${item}`).join("\n");
        case "tip":
          return `> **${b.title}:** ${b.text}`;
        case "quote":
          return `> ${b.text}${b.cite ? `\n> — ${b.cite}` : ""}`;
      }
    })
    .join("\n\n");
}

export function markdownToBlocks(source: string): Block[] {
  return source
    .replace(/\r\n?/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): Block => {
      const lines = chunk.split("\n").map((l) => l.trimEnd());
      if (lines.length === 1 && chunk.startsWith("### ")) return { type: "h3", text: chunk.slice(4).trim() };
      if (lines.length === 1 && chunk.startsWith("## ")) return { type: "h2", text: chunk.slice(3).trim() };
      if (lines.every((l) => /^[-*] /.test(l))) return { type: "ul", items: lines.map((l) => l.slice(2).trim()) };
      if (lines.every((l) => /^\d+\. /.test(l))) return { type: "ol", items: lines.map((l) => l.replace(/^\d+\. /, "").trim()) };
      if (lines.every((l) => l === ">" || l.startsWith("> "))) {
        const quoted = lines.map((l) => l.slice(2));
        const tip = quoted.join(" ").match(/^\*\*(.+?):\*\*\s+([\s\S]+)$/);
        if (tip) return { type: "tip", title: tip[1], text: tip[2].trim() };
        const last = quoted.at(-1) ?? "";
        const cite = quoted.length > 1 && last.startsWith("— ") ? last.slice(2).trim() : undefined;
        const text = (cite ? quoted.slice(0, -1) : quoted).join(" ").trim();
        return cite ? { type: "quote", text, cite } : { type: "quote", text };
      }
      return { type: "p", text: lines.join(" ").trim() };
    });
}

/** Plain words in a Markdown body, for word counts and reading time. */
export const markdownWords = (source: string) =>
  source
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*\-]|\d+\.\s/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

const WORDS_PER_MINUTE = 225;

export const readingMinutesOf = (source: string) => Math.max(1, Math.ceil(markdownWords(source) / WORDS_PER_MINUTE));
